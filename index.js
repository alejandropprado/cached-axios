'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CachedAxios = function () {
  function CachedAxios(storage) {
    var _this = this;

    _classCallCheck(this, CachedAxios);

    this.parse = function (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        return data;
      }
    };

    this.setCache = function (item, data, cachedBy) {
      return _this.storage.getItem(item).then(function (localData) {
        if (data && Array.isArray(data)) {
          var union = _lodash2.default.unionBy(data, localData, '_id');
          var latest = _lodash2.default.maxBy(data, function (obj) {
            return new Date(obj.updated_at).getTime();
          }) || {};

          return (latest.updated_at ? Promise.all([_this.storage.setItem(item + '_latest', latest[cachedBy || 'updated_at']), _this.storage.setItem(item, union)]) : _this.storage.setItem(item, union)).then(function () {
            return { data: union };
          });
        } else if (data && Object.keys(data).length) {
          var _latest = JSON.stringify(data);
          return Promise.all([_this.storage.setItem(item + '_latest', _latest), _this.storage.setItem(item, data)]).then(function () {
            return { data: data };
          });
        }

        return Promise.resolve({ data: localData });
      });
    };

    this.get = function (url) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var cachedBy = arguments[2];
      return _this.storage.getItem(url + '_latest').then(_this.parse).then(_this.getApi(url, options)).then(function (_ref) {
        var data = _ref.data;
        return _this.setCache(url, data, cachedBy);
      });
    };

    this.setDefaults = function (options) {
      _axios2.default.defaults = _extends({}, _axios2.default.defaults, options);
    };

    this.setAuthorizationToken = function (token) {
      _this.axios.defaults.headers.common.authorization = 'Bearer ' + token;
    };

    this.setBaseUrl = function (url) {
      return _this.axios.defaults.baseURL = url;
    };

    this.storage = storage;
    this.axios = _axios2.default;
  }

  _createClass(CachedAxios, [{
    key: 'getApi',
    value: function getApi(url, options) {
      var _this2 = this;

      return function () {
        var updatedAt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
        return _this2.axios.get(url, options.params ? _extends({}, options, {
          params: _extends({}, options.params, {
            q: _extends({}, options.params ? options.params.q : {}, updatedAt ? { updated_at: { $gt: updatedAt } } : {})
          })
        }) : { options: options });
      };
    }
  }]);

  return CachedAxios;
}();

exports.default = CachedAxios;
