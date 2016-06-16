(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'backbone', 'backbone-relational', 'underscore'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('backbone'), require('backbone-relational'), require('underscore'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.backbone, global.backboneRelational, global.underscore);
    global.backboneRelationalJsonapi = mod.exports;
  }
})(this, function (exports, _backbone, _backboneRelational, _underscore) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (Backbone, _) {

    //use internal copies if Backbone, Underscore and Relational are not passed.
    var Backbone = Backbone || _backbone2.default;
    Backbone.Relational = Backbone.Relational || _backboneRelational2.default;
    var _ = _ || _underscore2.default;

    var ModelFactory = function ModelFactory() {
      this.registeredModels = {};
    };

    ModelFactory.prototype.registerModel = function (model) {
      this.registeredModels[model.prototype.defaults.type] = model;
    };

    ModelFactory.prototype.findOrCreate = function (data) {
      if (this.registeredModels[data.type]) {
        var model = this.registeredModels[data.type].findOrCreate(data, { parse: true });
        if (model) return model;
      }
    };

    ModelFactory.prototype.createFromArray = function (items) {
      _.each(items, function (item) {
        this.findOrCreate(item);
      }, this);
    };

    Backbone.modelFactory = new ModelFactory();

    Backbone.Relational.Collection.prototype.parse = function (response) {
      console.log('parsing collection...');
      if (!response) return;

      if (response.included) Backbone.modelFactory.createFromArray(response.included);

      if (response.meta && this.handleMeta) this.handleMeta(response.meta);

      if (!response.data) {
        return response;
      }

      return response.data;
    };

    Backbone.Relational.Model.prototype.parse = function (response) {
      console.log('parsing model...');
      if (!response) return;

      if (response.included) Backbone.modelFactory.createFromArray(response.included);

      if (response.data) {
        response = response.data;
      }

      if (response.meta && this.handleMeta) this.handleMeta(response.meta);

      var data = response.attributes || {};
      data.id = response.id;

      if (response.relationships) {
        var simplifiedRelations = _.mapObject(response.relationships, function (value) {
          return value.data;
        });

        _.extend(data, simplifiedRelations);
      }

      return data;
    };
  };

  var _backbone2 = _interopRequireDefault(_backbone);

  var _backboneRelational2 = _interopRequireDefault(_backboneRelational);

  var _underscore2 = _interopRequireDefault(_underscore);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  ;
});