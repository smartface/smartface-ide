const parser = require('../smfObject/pgxParser');
const util = require('../util');

function Transpiler(opt) {
  const _opt = opt || {};
  this._template = _opt.template;

  if (typeof this._template !== 'function') {
    throw new Error(`Template Function Error -> opt.template must be function  but it is -> ${_opt.template}`);
  }

  this.generate = function (data) {
    return this._template(data);
  };

  this.parse = function (pgx) {
    return parser(pgx);
  };
}

module.exports = Transpiler;
