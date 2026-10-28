import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./ts-test-hook.mjs', import.meta.url)
