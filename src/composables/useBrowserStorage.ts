import { ref, watch, nextTick, onScopeDispose, toRaw } from "vue"
import {
	getExtensionStorage,
	setExtensionStorage,
	subscribeExtensionStorage,
} from "@/platform/webExtensionApi"

type JsonValue = string | number | boolean | null | undefined | JsonObject | JsonArray
type JsonObject = { [key: string]: JsonValue }
type JsonArray = JsonValue[]

function mergeDeep(defaults: JsonObject, source: JsonObject): JsonObject {
	// Merge the default options with the stored options
	const output: JsonObject = { ...defaults } // Start with defaults

	Object.keys(defaults).forEach((key) => {
		const defaultValue = defaults[key]
		const sourceValue = source?.[key]

		if (isObject(defaultValue) && isObject(sourceValue)) {
			// Recursively merge nested objects
			output[key] = mergeDeep(defaultValue, sourceValue)
		} else if (checkType(defaultValue, sourceValue)) {
			output[key] = sourceValue
		} else {
			// If the type is different, use the default value
			output[key] = defaultValue
			console.warn("Type mismatch", key, sourceValue)
		}
	})

	return output
}

function checkType(defaultValue: unknown, value: unknown): value is JsonValue {
	// Check if the value type is the same type as the default value or null
	// there are only strings, booleans, nulls and arrays as types left
	return (
		(value === null && defaultValue === null) ||
		(value !== null &&
			typeof value === typeof defaultValue &&
			Array.isArray(value) === Array.isArray(defaultValue))
	)
}
function isObject(value: unknown): value is JsonObject {
	return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function useBrowserSyncStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "sync")
}

export function useBrowserLocalStorage<T>(key: string, defaultValue: T) {
	return useBrowserStorage(key, defaultValue, "local")
}

function useBrowserStorage<T>(key: string, defaultValue: T, storageType: "sync" | "local" = "sync") {
	const data = ref<T>(defaultValue)
	let isUpdatingFromStorage = true
	let writeQueue = Promise.resolve()
	const defaultIsObject = isObject(defaultValue)
	const promise = (async () => {
		try {
			const storedValue = await getExtensionStorage(storageType, key)
			if (storedValue !== undefined) {
				if (defaultIsObject && isObject(storedValue as JsonValue)) {
					data.value = mergeDeep(defaultValue as JsonObject, storedValue as JsonObject) as T
				} else if (checkType(defaultValue, storedValue)) {
					data.value = storedValue as T
				}
			}
		} catch (error) {
			console.error(`[CommunityGlows] Unable to read ${storageType} storage key ${key}`, error)
		} finally {
			await nextTick()
			isUpdatingFromStorage = false
		}
		return true
	})()

	// Watch for changes in the storage and update chrome.storage
	watch(
		data,
		(newValue) => {
			if (!isUpdatingFromStorage) {
				if (checkType(defaultValue, newValue)) {
					const rawValue = toRaw(newValue)
					const snapshot = rawValue === undefined
						? undefined
						: JSON.parse(JSON.stringify(rawValue)) as unknown
					writeQueue = writeQueue
						.catch(() => undefined)
						.then(() => setExtensionStorage(storageType, key, snapshot))
						.catch((error) => {
							console.error(`[CommunityGlows] Unable to write ${storageType} storage key ${key}`, error)
						})
				} else {
					console.error("not updating " + key + ": type mismatch")
				}
			}
		},
		{ deep: true, flush: "post" },
	)
	const unsubscribe = subscribeExtensionStorage(storageType, key, async (newValue) => {
		if (newValue !== undefined && checkType(defaultValue, newValue)) {
			isUpdatingFromStorage = true
			data.value = newValue as T
			await nextTick()
			isUpdatingFromStorage = false
		}
	})
	onScopeDispose(unsubscribe, true)
	return { data, promise }
}
