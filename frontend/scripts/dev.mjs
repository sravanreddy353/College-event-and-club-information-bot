import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDirectory = fileURLToPath(new URL('../', import.meta.url))
const backendDirectory = resolve(frontendDirectory, '..', 'backend')
const pythonOnPath = process.platform === 'win32' ? 'py' : 'python3'
const pythonArguments = process.platform === 'win32' ? ['-3'] : []
const virtualEnvironmentPython = process.platform === 'win32'
  ? resolve(backendDirectory, '.venv', 'Scripts', 'python.exe')
  : resolve(backendDirectory, '.venv', 'bin', 'python')
const python = process.env.PYTHON || (
  existsSync(virtualEnvironmentPython) ? virtualEnvironmentPython : pythonOnPath
)
const pythonPrefix = python === pythonOnPath ? pythonArguments : []
let api
let frontend
let ownsApi = false
let stopping = false

function stop() {
  if (stopping) return
  stopping = true
  if (frontend && frontend.exitCode === null) frontend.kill()
  if (ownsApi && api && api.exitCode === null) api.kill()
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

async function apiIsReady() {
  try {
    const response = await fetch('http://127.0.0.1:8000/health', {
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

async function waitForApi() {
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    if (stopping || (api && api.exitCode !== null)) {
      throw new Error('The backend stopped before it became ready.')
    }
    if (await apiIsReady()) return
    await delay(1000)
  }
  throw new Error('The backend did not become ready within 3 minutes.')
}

try {
  if (await apiIsReady()) {
    console.log('Using the API already running on port 8000.')
  } else {
    console.log('Starting the API; first startup may take a little longer.')
    api = spawn(
      python,
      [...pythonPrefix, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'],
      { cwd: backendDirectory, stdio: 'inherit' },
    )
    ownsApi = true
    api.on('error', (error) => {
      console.error(`Could not start the backend: ${error.message}`)
      console.error('Install backend/requirements.txt in backend/.venv, or set PYTHON to its interpreter.')
      stop()
    })
    api.on('exit', (code) => {
      if (!stopping) {
        console.error(`The backend stopped${code === null ? '' : ` (exit ${code})`}.`)
        stop()
        process.exitCode = code || 1
      }
    })
  }
  await waitForApi()
  frontend = spawn(
    process.execPath,
    [resolve(frontendDirectory, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1'],
    { cwd: frontendDirectory, stdio: 'inherit' },
  )
  frontend.on('error', (error) => {
    console.error(`Could not start the frontend: ${error.message}`)
    stop()
  })
  frontend.on('exit', (code) => {
    if (!stopping) {
      stop()
      process.exitCode = code || 0
    }
  })
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local development startup failed.')
  stop()
  process.exitCode = 1
}
