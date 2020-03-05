// @flow
'use strict'

const { Transform } = require('stream')

const Vinyl = require('vinyl')
const PluginError = require('plugin-error')

const flowRemoveTypes = require('flow-remove-types')

export type GulpFlowTransformOptions = {
  sourceMap?: boolean,
  pretty?: boolean,
}

class GulpFlowTransform extends Transform {
  _gulpFlowOptions: GulpFlowTransformOptions

  constructor(options?: GulpFlowTransformOptions = {}) {
    super({
      objectMode: true,
    })

    this._gulpFlowOptions = options
  }

  _transform(
    vinylFile: Vinyl,
    encoding: string,
    callback: (error: ?Error, data: ?Vinyl) => void
  ) {
    if (vinylFile.isNull()) {
      callback(null, vinylFile)
    } else if (vinylFile.isBuffer()) {
      const { pretty, sourceMap } = this._gulpFlowOptions

      try {
        const transformedFile = flowRemoveTypes(
          vinylFile.contents.toString('utf8'),
          { pretty: !!pretty }
        )

        vinylFile.contents = Buffer.from(transformedFile.toString())
        this.push(vinylFile)

        if (sourceMap) {
          this.push(
            new Vinyl({
              cwd: vinylFile.cwd,
              base: vinylFile.base,
              path: vinylFile.path + '.map',
              contents: Buffer.from(
                JSON.stringify(transformedFile.generateMap())
              ),
            })
          )
        }

        callback()
      } catch (error) {
        this.emit('error', new PluginError('gulp-flow-remove-types2', error))
      }
    } else if (vinylFile.isStream()) {
      this.emit(
        'error',
        new PluginError(
          'gulp-flow-remove-types2',
          'flow-remove-types needs the whole file to process.'
        )
      )
    }
  }
}

module.exports = GulpFlowTransform
