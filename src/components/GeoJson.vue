<template>
  <TresGroup v-if="mergedShapeGeometry || mergedLineGeometry">
    <!-- 合并的填充几何体 -->
    <TresMesh
      @after-render="onShapeReady"
      v-if="mergedShapeGeometry"
      :geometry="mergedShapeGeometry"
    >
      <slot name="shape">
        <TresMeshBasicMaterial color="#409EFF" />
      </slot>
    </TresMesh>
    <!-- 合并的线段几何体 -->
    <TresLineSegments
      @after-render="onLineReady"
      v-if="mergedLineGeometry"
      :geometry="mergedLineGeometry"
    >
      <slot name="line">
        <TresLineBasicMaterial color="#000000" />
      </slot>
    </TresLineSegments>
    <slot></slot>
  </TresGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGeojson } from '@/hooks/useGeojson'
import { BufferGeometry } from 'three'

const props = withDefaults(
  defineProps<{
    url: string
    mercatorCenter: [number, number]
    options?: Partial<
      Options & {
        refresh: boolean
        immediate: boolean
      }
    >
  }>(),
  {
    options: () => {
      return {
        mercatorScale: 30,
        mercatorTranslate: [0, 0],
        extrudeDepth: 1,
        lineOffset: 0.01,
        needShapeGeometry: true,
        needLineGeometry: true,
        refresh: false,
        immediate: true,
      }
    },
  },
)

const emit = defineEmits<{
  (e: 'shape-ready'): void
  (e: 'line-ready'): void
  (e: 'geojson-error', error: unknown): void
  (
    e: 'geojson-result',
    mergedShapeGeometry: BufferGeometry | undefined,
    mergedLineGeometry: BufferGeometry | undefined,
  ): void
}>()

const url = computed(() => props.url)
const mercatorCenter = computed(() => props.mercatorCenter)
const options = computed(() => props.options)

const { mergedShapeGeometry, mergedLineGeometry, onResult, onError } = useGeojson(
  url,
  mercatorCenter,
  options,
)
onResult((result) => {
  emit('geojson-result', result.mergedShapeGeometry, result.mergedLineGeometry)
})
onError((error) => {
  emit('geojson-error', error)
})

const onShapeReady = () => {
  emit('shape-ready')
}

const onLineReady = () => {
  emit('line-ready')
}
</script>

<style scoped></style>
