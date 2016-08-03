(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.backboneRelationalJsonapi = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (Backbone, _) {
    var ModelFactory = function () {
      function ModelFactory() {
        _classCallCheck(this, ModelFactory);

        this.registeredModels = {};
      }

      _createClass(ModelFactory, [{
        key: 'registerModel',
        value: function registerModel(model) {
          this.registeredModels[model.prototype.defaults.type] = model;
        }
      }, {
        key: 'findOrCreate',
        value: function findOrCreate(data, options, type) {
          options = _.extend({ parse: true }, options);
          if (this.registeredModels[data.type || type]) {
            var model = this.registeredModels[data.type || type].findOrCreate(data, options);
            if (model) return model;
          }
        }
      }, {
        key: 'createFromArray',
        value: function createFromArray(items, options, type) {
          _.each(items, function (item) {
            this.findOrCreate(item, options, type);
          }, this);
        }
      }]);

      return ModelFactory;
    }();

    Backbone.Relational.modelFactory = new ModelFactory();

    Backbone.Relational.Collection.prototype.parse = function (response, options) {
      var type = this.model.prototype.defaults.type;
      console.log('Parsing collection...', response);
      if (!response) return;

      if (response.data) Backbone.Relational.modelFactory.createFromArray(response.data, options, type);

      if (response.meta && this.handleMeta) this.handleMeta(response.meta);

      if (!response.data) {
        return response;
      }

      return response.data;
    };

    Backbone.Relational.Model.prototype.parse = function (response, options) {
      console.log('Parsing model...', response);
      if (!response) return;

      if (response.included) Backbone.Relational.modelFactory.createFromArray(response.included, options);

      if (response.data) {
        response = response.data;
      }

      if (response.meta && this.handleMeta) this.handleMeta(response.meta);

      var data = !response.attributes && !response.type ? response : response.attributes || {};
      data.id = response.id;

      if (response.relationships) {
        var simplifiedRelations = _.mapObject(response.relationships, function (value) {
          return value.data;
        });

        _.extend(data, simplifiedRelations);
      }

      console.log('Returning Model: ', data);

      return data;
    };

    return Backbone;
  };

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();
});