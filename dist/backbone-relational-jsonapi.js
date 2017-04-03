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
        key: 'getSimplifiedRelations',
        value: function getSimplifiedRelations(relationships) {
          if (relationships) {
            var simplifiedRelations = _.mapObject(relationships, function (value) {
              return value.data;
            });
            var meta = _.mapObject(relationships, function (value) {
              return value.meta;
            });
            return { models: simplifiedRelations, meta: meta };
          } else {
            return {};
          }
        }
      }, {
        key: 'findOrCreate',
        value: function findOrCreate(data, options, type) {
          var attributes = data.attributes ? data.attributes : data;
          attributes.id = data.id;
          var relations = this.getSimplifiedRelations(data.relationships);
          _.extend(attributes, relations.models);

          options = _.extend({ parse: true }, options);
          if (this.registeredModels[type]) {
            var model = this.registeredModels[type].findOrCreate(attributes, options);
            //console.log('RESULTING MODEL: ', model);
            if (model) {
              //handle the meta for each relationship
              _.each(relations.meta, function (meta, key) {
                if (model.get(key) && model.get(key).handleMeta) {
                  model.get(key).handleMeta(meta);
                }
              });
              return model;
            }
          }
        }
      }, {
        key: 'createFromArray',
        value: function createFromArray(items, options, type) {
          _.each(items, function (item) {
            type = item.type || type;
            //delete item.type;
            this.findOrCreate(item, options, type);
          }, this);
        }
      }]);

      return ModelFactory;
    }();

    Backbone.Relational.modelFactory = new ModelFactory();

    Backbone.Relational.Collection.prototype.parse = function (response, options) {
      var type = this.model.prototype.defaults.type;
      //console.log('Parsing collection...', response);
      if (!response) return;

      if (response.included) Backbone.Relational.modelFactory.createFromArray(response.included, options, type);

      if (response.meta && this.handleMeta) this.handleMeta(response.meta);

      if (!response.data) {
        return response;
      }

      return response.data;
    };

    Backbone.Relational.Model.prototype.parse = function (response, options) {
      //console.log('Parsing model...', response);
      if (!response) return;

      if (response.included) Backbone.Relational.modelFactory.createFromArray(response.included, options);

      if (response.data) {
        response = response.data;
      }

      if (response.meta && this.handleMeta) {
        this.handleMeta(response.meta);
      }

      var data = !response.attributes && !response.type ? response : response.attributes || {};
      data.id = response.id;

      _.extend(data, Backbone.Relational.modelFactory.getSimplifiedRelations(response.relationships).models);

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