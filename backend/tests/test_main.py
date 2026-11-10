import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import main


class FakeCollection:
    def __init__(self):
        self.records = {}
        self.add_calls = 0

    def get(self, include):
        return {
            "ids": list(self.records),
            "metadatas": [record["metadata"] for record in self.records.values()],
        }

    def count(self):
        return len(self.records)

    def add(self, ids, documents, metadatas):
        self.add_calls += 1
        for chunk_id, document, metadata in zip(ids, documents, metadatas):
            self.records[chunk_id] = {"document": document, "metadata": metadata}

    def update(self, ids, metadatas):
        for chunk_id, metadata in zip(ids, metadatas):
            self.records[chunk_id]["metadata"] = metadata

    def delete(self, ids):
        for chunk_id in ids:
            self.records.pop(chunk_id, None)


class FakeSearchCollection:
    def __init__(self, documents):
        self.documents = documents

    def count(self):
        return len(self.documents)

    def query(self, query_texts, n_results, include):
        selected = self.documents[:n_results]
        return {
            "documents": [[document for document, _, _ in selected]],
            "metadatas": [[metadata for _, metadata, _ in selected]],
            "distances": [[distance for _, _, distance in selected]],
        }


class FakePage:
    def __init__(self, text):
        self.text = text

    def extract_text(self):
        return self.text


class IngestionTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.documents_dir = Path(self.temp_dir.name)
        self.original_documents_dir = main.DOCUMENTS_DIR
        self.original_collection = main.knowledge_collection
        self.collection = FakeCollection()
        main.DOCUMENTS_DIR = self.documents_dir
        main.knowledge_collection = self.collection

    def tearDown(self):
        main.DOCUMENTS_DIR = self.original_documents_dir
        main.knowledge_collection = self.original_collection
        self.temp_dir.cleanup()

    def test_ingest_preserves_pdf_pages_and_skips_unchanged_files(self):
        (self.documents_dir / "calendar.txt").write_text(
            "The spring festival is held on April 12.", encoding="utf-8"
        )
        (self.documents_dir / "handbook.pdf").write_bytes(b"fake pdf")
        fake_reader = SimpleNamespace(
            pages=[FakePage("Page one details."), FakePage("Page two details.")]
        )

        with patch.object(main, "PdfReader", return_value=fake_reader):
            first_result = main.sync_knowledge_base()

        self.assertEqual(first_result.files_found, 2)
        self.assertEqual(first_result.added_chunks, 3)
        pdf_pages = {
            record["metadata"]["page_number"]
            for record in self.collection.records.values()
            if record["metadata"]["filename"] == "handbook.pdf"
        }
        self.assertEqual(pdf_pages, {1, 2})
        self.assertTrue(
            all(
                "page_number" not in record["metadata"]
                for record in self.collection.records.values()
                if record["metadata"]["filename"] == "calendar.txt"
            )
        )

        with patch.object(main, "PdfReader", side_effect=AssertionError("PDF re-read")):
            second_result = main.sync_knowledge_base()

        self.assertEqual(second_result.unchanged_files, 2)
        self.assertEqual(second_result.files_processed, 0)
        self.assertEqual(second_result.added_chunks, 0)
        self.assertEqual(self.collection.add_calls, 1)

    def test_changed_and_removed_files_update_the_index(self):
        source = self.documents_dir / "dates.txt"
        source.write_text("The meeting is on May 2.", encoding="utf-8")
        main.sync_knowledge_base()
        old_ids = set(self.collection.records)

        source.write_text("The meeting is on May 9.", encoding="utf-8")
        changed_result = main.sync_knowledge_base()

        self.assertGreater(changed_result.added_chunks, 0)
        self.assertGreater(changed_result.removed_chunks, 0)
        self.assertFalse(old_ids.intersection(self.collection.records))
        self.assertIn("May 9", next(iter(self.collection.records.values()))["document"])

        source.unlink()
        removed_result = main.sync_knowledge_base()
        self.assertEqual(removed_result.indexed_chunks, 0)
        self.assertGreater(removed_result.removed_chunks, 0)

    def test_chunking_keeps_activity_records_together_and_omits_test_prompts(self):
        text = (
            "FICTIONAL DEMO DATA — NOT REAL COLLEGE INFORMATION\n"
            "Document: Sample Events\n\n"
            "Event 1\nName: Campus TechFest Demo\nDate: 18 November 2026\n"
            "Venue: Main Auditorium\n\n"
            "Event 2\nName: Green Campus Day Demo\nDate: 24 November 2026\n"
            "Venue: Central Garden\n\n"
            "RAG TEST QUESTIONS\n- What events are happening?\n\n"
            "Reminder: Fictional data only."
        )

        chunks = main.chunk_text(text)

        self.assertEqual(len(chunks), 3)
        self.assertIn("Event 1 Name: Campus TechFest Demo", chunks[1])
        self.assertIn("18 November 2026", chunks[1])
        self.assertIn("Main Auditorium", chunks[1])
        self.assertIn("Event 2 Name: Green Campus Day Demo", chunks[2])
        self.assertTrue(all("RAG TEST QUESTIONS" not in chunk for chunk in chunks))

    def test_empty_document_is_reported_without_creating_chunks(self):
        (self.documents_dir / "empty.txt").write_text("", encoding="utf-8")

        result = main.sync_knowledge_base()

        self.assertEqual(result.files_found, 1)
        self.assertEqual(result.files_processed, 1)
        self.assertEqual(result.indexed_chunks, 0)
        self.assertEqual(result.failures, ["empty.txt: no extractable text; no chunks were indexed."])

    def test_invalid_text_encoding_is_reported(self):
        (self.documents_dir / "invalid.txt").write_bytes(b"\xff\xfe\xfa")

        result = main.sync_knowledge_base()

        self.assertEqual(result.files_found, 1)
        self.assertEqual(result.files_processed, 0)
        self.assertEqual(result.indexed_chunks, 0)
        self.assertTrue(result.failures[0].startswith("invalid.txt: "))


class ChatTests(unittest.TestCase):
    def test_student_faq_questions_retrieve_their_fictional_demo_guidance(self):
        questions_and_documents = [
            (
                "How can I register for a technical event?",
                "events.txt",
                "Check the Registration field in the matching event",
                "Check the Registration field in the matching event, workshop, or competition entry for its fictional registration method and deadline.",
            ),
            (
                "How can I join the coding club?",
                "clubs.txt",
                "submit an interest form at the fictional Student Activities Desk",
                "For example, the fictional Coding Club Demo procedure is to submit an interest form at the fictional Student Activities Desk.",
            ),
            (
                "Where can I find event schedules?",
                "events.txt",
                "Each entry lists its date, time, and venue",
                "To find an event schedule in these demo records, use the event entries below. Each entry lists its date, time, and venue.",
            ),
        ]
        original_collection = main.knowledge_collection
        try:
            for question, expected_filename, expected_text, document in questions_and_documents:
                with self.subTest(question=question):
                    main.knowledge_collection = FakeSearchCollection(
                        [
                            (
                                document,
                                {
                                    "filename": expected_filename,
                                    "fictional_demo": True,
                                },
                                0.2,
                            )
                        ]
                    )
                    context = main.retrieve_context(question)
                    self.assertTrue(context)
                    self.assertEqual(context[0].filename, expected_filename)
                    self.assertIn(expected_text, context[0].text)
                    self.assertTrue(context[0].fictional_demo)
        finally:
            main.knowledge_collection = original_collection

    def test_chat_uses_retrieved_context_and_returns_page_citations(self):
        fake_models = SimpleNamespace(
            generate_content=Mock(return_value=SimpleNamespace(text="The festival is April 12."))
        )
        fake_client = SimpleNamespace(models=fake_models)
        retrieved = [
            main.RetrievedChunk(
                text="The spring festival is held on April 12.",
                filename="calendar.pdf",
                page_number=3,
            )
        ]

        with (
            patch.object(main, "gemini_client", fake_client),
            patch.object(main, "retrieve_context", return_value=retrieved),
            patch.object(main, "search_web", return_value=[]),
        ):
            response = main.chat(main.ChatRequest(message="When is the festival?"))

        prompt = fake_models.generate_content.call_args.kwargs["contents"]
        self.assertIn("The spring festival is held on April 12.", prompt)
        self.assertIn("When is the festival?", prompt)
        self.assertEqual(response.answer, "The festival is April 12.")
        self.assertEqual(
            [source.model_dump() for source in response.sources],
            [
                {
                    "filename": "calendar.pdf",
                    "page_number": 3,
                    "title": None,
                    "url": None,
                    "source_type": "document",
                }
            ],
        )

    def test_chat_combines_local_and_live_web_sources_without_gemini(self):
        context = [
            main.RetrievedChunk(
                text="KARE TechFest is a historical event record.",
                filename="events.txt",
                page_number=None,
            )
        ]
        web_results = [
            main.WebResult(
                title="Official KARE events",
                url="https://www.kalasalingam.ac.in/events/",
                snippet="KARE TechFest dates and announcements.",
                content="KARE TechFest dates and announcements.",
                source_type="official",
            )
        ]
        with (
            patch.object(main, "gemini_client", None),
            patch.object(main, "retrieve_context", return_value=context),
            patch.object(main, "search_web", return_value=web_results),
        ):
            response = main.chat(main.ChatRequest(message="What is KARE TechFest?"))

        self.assertIn("Local college record", response.answer)
        self.assertIn("Official KARE source", response.answer)
        self.assertEqual(response.sources[0].url, web_results[0].url)
        self.assertEqual(response.sources[0].source_type, "official")
        self.assertEqual(response.sources[1].filename, "events.txt")

    def test_prompt_identifies_fictional_demo_records(self):
        prompt = main.create_prompt(
            "When is the demo event?",
            [
                main.RetrievedChunk(
                    text="The demo event is on November 18.",
                    filename="events.txt",
                    page_number=None,
                    fictional_demo=True,
                )
            ],
            [],
        )

        self.assertIn("[Fictional demo record: events.txt]", prompt)
        self.assertIn("not a real college announcement", prompt)

    def test_chat_returns_unavailable_when_no_context_matches(self):
        with (
            patch.object(main, "gemini_client", None),
            patch.object(main, "retrieve_context", return_value=[]),
            patch.object(main, "search_web", return_value=[]),
        ):
            response = main.chat(main.ChatRequest(message="What is the event date?"))

        self.assertEqual(response.answer, main.UNAVAILABLE_ANSWER)
        self.assertEqual(response.sources, [])

    def test_bing_search_result_parser_extracts_title_url_and_snippet(self):
        html = """
        <ol>
          <li class="b_algo">
            <h2><a href="https://www.kalasalingam.ac.in/clubs/">KARE Clubs</a></h2>
            <p>Official KARE clubs and student activities.</p>
          </li>
        </ol>
        """

        self.assertEqual(
            main._parse_bing_results(html),
            [
                (
                    "KARE Clubs",
                    "https://www.kalasalingam.ac.in/clubs/",
                    "Official KARE clubs and student activities.",
                )
            ],
        )

    def test_yahoo_search_result_parser_extracts_title_url_and_snippet(self):
        html = """
        <li><div class="dd algo">
          <div class="compTitle">
            <a href="https://r.search.yahoo.com/RU=https%3a%2f%2fexample.org%2fkare-clubs/RK=2/RS=test">
              <h3>KARE Clubs</h3>
            </a>
          </div>
          <div class="compText"><p>Relevant clubs at Kalasalingam.</p></div>
        </div></li>
        """

        self.assertEqual(
            main._parse_yahoo_results(html),
            [
                (
                    "KARE Clubs",
                    "https://example.org/kare-clubs",
                    "Relevant clubs at Kalasalingam.",
                )
            ],
        )

    def test_search_relevance_matches_plural_question_terms(self):
        self.assertGreater(
            main._web_relevance_score(
                "Which clubs are available?",
                "Nature Club at KARE",
                "Student club information.",
            ),
            0,
        )

    def test_live_search_combines_official_and_relevant_indexed_results(self):
        official_results = [
            (
                "KARE Clubs",
                "https://www.kalasalingam.ac.in/clubs/",
                "",
            )
        ]
        indexed_results = [
            (
                "KARE student clubs",
                "https://example.org/kare-student-clubs",
                "A guide to clubs at Kalasalingam.",
            ),
            (
                "Unrelated news",
                "https://example.org/unrelated",
                "A story about unrelated technology.",
            ),
        ]
        with (
            patch.object(main, "_search_kare_official", return_value=official_results),
            patch.object(main, "_search_bing", return_value=indexed_results),
            patch.object(main, "_search_yahoo", return_value=[]),
            patch.object(main, "_is_safe_public_url", return_value=True),
            patch.object(main, "_clean_webpage_text", return_value="Official and indexed page content."),
        ):
            results = main.search_web("Which clubs are available?")

        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].source_type, "official")
        self.assertEqual(results[1].source_type, "web")
        self.assertEqual(
            [result.url for result in results],
            [
                "https://www.kalasalingam.ac.in/clubs/",
                "https://example.org/kare-student-clubs",
            ],
        )
        self.assertTrue(all(result.content == "Official and indexed page content." for result in results))


if __name__ == "__main__":
    unittest.main()
