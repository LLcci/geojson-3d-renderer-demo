<template>
  <TresCanvas clear-color="#82DBC5" window-size>
    <TresPerspectiveCamera :position="[0, 0, 50]" :look-at="[0, 0, 0]" />
    <OrbitControls />
    <TresAmbientLight color="#404040" :intensity="0.6" />
    <TresDirectionalLight color="#ffffff" :intensity="0.8" :position="[10, 10, 10]" />
    <Stats />
    <GeoJson
      :url="url"
      :mercator-center="mercatorCenter"
      :options="options"
      :scale="3"
      :rotation="[-Math.PI / 4, 0, 0]"
    >
      <Html center transform :distance-factor="4" :position="[0, 0, 0.75]" :scale="10">
        <h1>中国地图</h1>
      </Html>
    </GeoJson>
  </TresCanvas>
</template>

<script setup lang="ts">
import GeoJson from '@/components/GeoJson.vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, Stats, Html } from '@tresjs/cientos'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { computed, ref } from 'vue'

const params = ref({
  url: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full_city.json',
  mercatorCenterX: 104.0,
  mercatorCenterY: 37.5,
  options: {
    mercatorScale: 30,
    mercatorTranslateX: 0,
    mercatorTranslateY: 0,
    extrudeDepth: 1,
    lineOffset: 0.01,
    needShapeGeometry: true,
    needLineGeometry: true,
    refresh: true,
    immediate: true,
  },
})
const gui = new GUI()
gui.add(params.value, 'url')
gui.add(params.value, 'mercatorCenterX')
gui.add(params.value, 'mercatorCenterY')
const optFolder = gui.addFolder('options')
optFolder.add(params.value.options, 'mercatorScale')
optFolder.add(params.value.options, 'mercatorTranslateX')
optFolder.add(params.value.options, 'mercatorTranslateY')
optFolder.add(params.value.options, 'extrudeDepth')
optFolder.add(params.value.options, 'lineOffset')
optFolder.add(params.value.options, 'needShapeGeometry', [true, false])
optFolder.add(params.value.options, 'needLineGeometry', [true, false])
optFolder.add(params.value.options, 'refresh', [true, false])
optFolder.add(params.value.options, 'immediate', [true, false])

const url = computed(() => params.value.url)
const mercatorCenter = computed<[number, number]>(() => [
  params.value.mercatorCenterX,
  params.value.mercatorCenterY,
])
const options = computed<
  Options & {
    refresh: boolean
    immediate: boolean
  }
>(() => {
  return {
    mercatorScale: params.value.options.mercatorScale,
    mercatorTranslate: [
      params.value.options.mercatorTranslateX,
      params.value.options.mercatorTranslateY,
    ],
    extrudeDepth: params.value.options.extrudeDepth,
    lineOffset: params.value.options.lineOffset,
    needShapeGeometry: params.value.options.needShapeGeometry,
    needLineGeometry: params.value.options.needLineGeometry,
    refresh: params.value.options.refresh,
    immediate: params.value.options.immediate,
  }
})
</script>

<style scoped></style>
