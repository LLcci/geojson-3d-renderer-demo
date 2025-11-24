import { geoMercator, json, type GeoProjection } from 'd3'
import { BufferGeometry, ExtrudeGeometry, Shape, Float32BufferAttribute } from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js'

/**
 * 生成geojson文件的形状几何体和线段几何体的
 * @param url geojson文件路径
 * @param mercatorCenter 墨卡托投影中心坐标
 * @param options mercatorScale 墨卡托投影缩放比例 默认值为30; mercatorTranslate 墨卡托投影平移量 默认值为[0, 0]; extrudeDepth  填充几何体深度 默认值为1; lineOffset 线段在填充几何体上方的偏移量 默认值为0.01; needShapeGeometry 是否需要填充几何体 默认值为true; needLineGeometry 是否需要线段几何体 默认值为true;
 */
export const genGeojsonGeometry = (
  url: string,
  mercatorCenter: [number, number],
  options: Partial<Options> = {
    mercatorScale: 30,
    mercatorTranslate: [0, 0],
    extrudeDepth: 1,
    lineOffset: 0.01,
    needShapeGeometry: true,
    needLineGeometry: true,
  },
) => {
  const defaultOptions: Options = {
    mercatorScale: 30,
    mercatorTranslate: [0, 0],
    extrudeDepth: 1,
    lineOffset: 0.01,
    needLineGeometry: true,
    needShapeGeometry: true,
  }
  const mergedOptions = { ...defaultOptions, ...options }
  /**
   * 生成的形状几何体列表
   */
  const shapeGeometryList: ExtrudeGeometry[] = []
  /**
   * 生成的线段几何体列表
   */
  const lineGeometryList: BufferGeometry[] = []
  /**
   * 合并后的形状几何体
   */
  let mergedShapeGeometry: BufferGeometry
  /**
   * 合并后的线段几何体
   */
  let mergedLineGeometry: BufferGeometry
  /**
   * 线段在填充几何体上方的偏移量
   */
  const lineZPosition = mergedOptions.extrudeDepth + mergedOptions.lineOffset
  /**
   * 创建线段几何体的函数
   * @param polygon 多边形坐标数组
   * @param projection 投影函数
   * @returns 生成的线段几何体
   */
  const createLineSegmentsFromPolygon = (polygon: number[][], projection: GeoProjection) => {
    // 使用 TypedArray 构建顶点，避免大量 Vector3 分配
    const n = polygon.length
    if (n < 2) return new BufferGeometry()
    // 边数等于 n（闭合），每条边两端两个顶点 => n * 2 顶点
    const vertexCount = n * 2
    const positions = new Float32Array(vertexCount * 3)
    let ptr = 0
    for (let i = 0; i < n; i++) {
      const a = polygon[i] as [number, number]
      const b = polygon[(i + 1) % n] as [number, number]
      const [ax, ay] = projection(a) || [0, 0]
      const [bx, by] = projection(b) || [0, 0]
      positions[ptr++] = ax
      positions[ptr++] = -ay
      positions[ptr++] = lineZPosition

      positions[ptr++] = bx
      positions[ptr++] = -by
      positions[ptr++] = lineZPosition
    }
    const lineGeometry = new BufferGeometry()
    lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return lineGeometry
  }

  /**
   * 创建几何体的函数
   * @param polygon 多边形坐标数组
   * @param projection 投影函数
   * @returns 生成的几何体
   */
  const createGeometryFromPolygon = (polygon: number[][], projection: GeoProjection) => {
    const shape = new Shape()
    let firstPoint = true

    polygon.forEach((coord) => {
      const [x, y] = projection(coord as [number, number]) || [0, 0]
      if (firstPoint) {
        shape.moveTo(x, -y)
        firstPoint = false
      } else {
        shape.lineTo(x, -y)
      }
    })

    const extrudeSettings = {
      depth: mergedOptions.extrudeDepth,
      bevelEnabled: false,
    }

    const geometry = new ExtrudeGeometry(shape, extrudeSettings)
    return geometry
  }

  return json(url)
    .then((geojson) => {
      // 墨卡托投影函数
      const projection = geoMercator()
        .center(mercatorCenter)
        .scale(mergedOptions.mercatorScale)
        .translate(mergedOptions.mercatorTranslate)

      ;(geojson as GeoJSON.FeatureCollection<GeoJSON.Geometry>).features.forEach((feature) => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach((polygon) => {
            if (mergedOptions.needShapeGeometry) {
              const shapeGeometry = createGeometryFromPolygon(polygon as number[][], projection)
              shapeGeometryList.push(shapeGeometry)
            }

            if (mergedOptions.needLineGeometry) {
              const lineGeometry = createLineSegmentsFromPolygon(polygon as number[][], projection)
              lineGeometryList.push(lineGeometry)
            }
          })
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((multiPolygon) => {
            ;(multiPolygon as number[][][]).forEach((polygon) => {
              if (mergedOptions.needShapeGeometry) {
                const shapeGeometry = createGeometryFromPolygon(polygon as number[][], projection)
                shapeGeometryList.push(shapeGeometry)
              }

              if (mergedOptions.needLineGeometry) {
                const lineGeometry = createLineSegmentsFromPolygon(
                  polygon as number[][],
                  projection,
                )
                lineGeometryList.push(lineGeometry)
              }
            })
          })
        }
      })

      if (mergedOptions.needShapeGeometry) {
        mergedShapeGeometry = BufferGeometryUtils.mergeGeometries(shapeGeometryList)
        mergedShapeGeometry?.computeBoundingSphere()
      }

      if (mergedOptions.needLineGeometry) {
        mergedLineGeometry = BufferGeometryUtils.mergeGeometries(lineGeometryList)
        mergedLineGeometry?.computeBoundingSphere()
      }
      return {
        mergedShapeGeometry,
        mergedLineGeometry,
      }
    })
    .catch((error) => {
      throw error
    })
}
