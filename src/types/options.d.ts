type Options = {
  /**
   * 墨卡托投影缩放比例
   */
  mercatorScale: number
  /**
   * 墨卡托投影平移量
   */
  mercatorTranslate: [number, number]
  /**
   * 形状几何体深度
   */
  extrudeDepth: number
  /**
   * 线段在填充几何体上方的偏移量
   */
  lineOffset: number
  /**
   * 是否需要形状几何体
   */
  needShapeGeometry?: boolean
  /**
   * 是否需要线段几何体
   */
  needLineGeometry?: boolean
}
