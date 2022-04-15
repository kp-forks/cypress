import { Ref, onMounted, ref, watch, watchEffect, onBeforeUnmount, readonly } from 'vue'
import { getAutIframeModel, UnifiedRunnerAPI } from '../runner'
import { useSpecStore } from '../store'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type { SpecFile } from '@packages/types/src'
import { useRoute } from 'vue-router'
import { getPathForPlatform } from '../paths'

const initialized = ref(false)

export function useUnifiedRunner (specs: Ref<ReadonlyArray<SpecFile>>) {
  onMounted(async () => {
    await UnifiedRunnerAPI.initialize()
    initialized.value = true
  })

  onBeforeUnmount(() => {
    UnifiedRunnerAPI.teardown()
    initialized.value = false
  })

  const specStore = useSpecStore()
  const route = useRoute()
  const selectorPlaygroundStore = useSelectorPlaygroundStore()

  watchEffect(() => {
    const queryFile = getPathForPlatform(route.query.file as string)

    if (!queryFile) {
      // no file param, we are not showing a file
      // so no action needed when specs list updates
      return
    }

    const activeSpecInSpecsList = specs.value.find((x) => x.relative === queryFile)

    if (specStore.activeSpec?.relative !== activeSpecInSpecsList?.relative) {
      specStore.setActiveSpec(activeSpecInSpecsList ?? null)
    }
  })

  watch(() => getPathForPlatform(route.query.file as string), (newQueryFile) => {
    if (selectorPlaygroundStore.show) {
      const autIframe = getAutIframeModel()

      autIframe.toggleSelectorPlayground(false)
      selectorPlaygroundStore.setEnabled(false)
      selectorPlaygroundStore.setShow(false)
    }
  }, { flush: 'post' })

  return {
    initialized: readonly(initialized),
  }
}
