import { createEventHook } from '@vueuse/core'
import { BufferGeometry } from 'three'
import { isRef, onUnmounted, ref, toRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { genGeojsonGeometry } from '@/utils/genGeojsonGeometry'

/**
 * 生成geojson文件的形状几何体和线段几何体的hook
 * @param url geojson文件路径
 * @param mercatorCenter 墨卡托投影中心坐标
 * @param options mercatorScale 墨卡托投影缩放比例 默认值为30; mercatorTranslate 墨卡托投影平移量 默认值为[0, 0]; extrudeDepth  形状几何体深度 默认值为1; lineOffset 线段在填充几何体上方的偏移量 默认值为0.01; needShapeGeometry 是否需要填充几何体 默认值为true; needLineGeometry 是否需要线段几何体 默认值为true; refresh 是否在参数变化时重新生成 默认值为false; immediate 是否在初始化时立即生成 默认值为true
 */
export const useGeojson = (
  url: MaybeRefOrGetter<string>,
  mercatorCenter: MaybeRefOrGetter<[number, number]>,
  options: MaybeRefOrGetter<
    Partial<
      Options & {
        refresh: boolean
        immediate: boolean
      }
    >
  > = {
    mercatorScale: 30,
    mercatorTranslate: [0, 0],
    extrudeDepth: 1,
    lineOffset: 0.01,
    needShapeGeometry: true,
    needLineGeometry: true,
    refresh: false,
    immediate: true,
  },
) => {
  const defaultOptions: Options & {
    refresh: boolean
    immediate: boolean
  } = {
    mercatorScale: 30,
    mercatorTranslate: [0, 0],
    extrudeDepth: 1,
    lineOffset: 0.01,
    needLineGeometry: true,
    needShapeGeometry: true,
    refresh: false,
    immediate: true,
  }
  let targetOptions = toValue(options)
  let targetUrl = toValue(url)
  let targetMercatorCenter = toValue(mercatorCenter)
  let mergedOptions = { ...defaultOptions, ...targetOptions }
  const isGeneration = ref(false)
  /**
   * 合并后的形状几何体
   */
  const mergedShapeGeometry = ref<BufferGeometry>()
  /**
   * 合并后的线段几何体
   */
  const mergedLineGeometry = ref<BufferGeometry>()

  const geojsonGenResult = createEventHook<{
    mergedShapeGeometry: BufferGeometry | undefined
    mergedLineGeometry: BufferGeometry | undefined
  }>()
  const geojsonGenError = createEventHook()

  // 手动释放内存的函数
  const dispose = () => {
    mergedShapeGeometry.value?.dispose()
    mergedLineGeometry.value?.dispose()
    mergedShapeGeometry.value = undefined
    mergedLineGeometry.value = undefined
  }

  const execute = () => {
    if (isGeneration.value) {
      console.warn('Geojson is generating, please wait for the result.')
      return
    }
    isGeneration.value = true
    dispose()
    genGeojsonGeometry(targetUrl, targetMercatorCenter, mergedOptions)
      .then((geojsonGeometry) => {
        mergedShapeGeometry.value = geojsonGeometry.mergedShapeGeometry
        mergedLineGeometry.value = geojsonGeometry.mergedLineGeometry
        geojsonGenResult.trigger(geojsonGeometry)
      })
      .catch((error) => {
        geojsonGenError.trigger(error.message)
      })
      .finally(() => {
        isGeneration.value = false
      })
  }

  if (mergedOptions.immediate) {
    execute()
  }

  if (isRef(url) || isRef(mercatorCenter) || isRef(options)) {
    const urlRef = toRef(url)
    const mercatorCenterRef = toRef(mercatorCenter)
    const optionsRef = toRef(options)
    watch(
      [urlRef, mercatorCenterRef, optionsRef],
      () => {
        if (optionsRef.value.refresh) {
          targetUrl = toValue(url)
          targetMercatorCenter = toValue(mercatorCenter)
          targetOptions = toValue(options)
          mergedOptions = { ...defaultOptions, ...targetOptions }
          execute()
        }
      },
      { deep: true },
    )
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    dispose()
  })

  return {
    isGeneration,
    mergedShapeGeometry,
    mergedLineGeometry,
    onResult: geojsonGenResult.on,
    onError: geojsonGenError.on,
    dispose,
    execute,
  }
}
