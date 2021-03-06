import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import { terser } from "rollup-plugin-terser"

export default {
  plugins: [
    terser(),
    babel({
      plugins: [
        ["transform-react-jsx", { pragma: "h" }]
      ]
    }),
    resolve({
      jsnext: true
    }),
    serve(),
    livereload()
  ]
}