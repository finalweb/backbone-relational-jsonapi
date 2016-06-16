'use strict';
import myBackbone from 'backbone';
import Relational from 'backbone-relational';
import underscore from 'underscore';

export default function(Backbone, _){

  //use internal copies if Backbone, Underscore and Relational are not passed.
  var Backbone = Backbone || myBackbone;
  Backbone.Relational = Backbone.Relational || Relational;
  var _ = _ || underscore;

  var ModelFactory = function() {
    this.registeredModels = {};
  };

  ModelFactory.prototype.registerModel = function(model) {
    this.registeredModels[model.prototype.defaults.type] = model;
  }

  ModelFactory.prototype.findOrCreate = function(data) {
    if (this.registeredModels[data.type]){
      var model = this.registeredModels[data.type].findOrCreate(data, {parse: true});
      if(model)
        return model;
    }

  }

  ModelFactory.prototype.createFromArray = function(items) {
    _.each(items, function(item) {
      this.findOrCreate(item);
    }, this);
  };

  Backbone.modelFactory = new ModelFactory();

  Backbone.Relational.Collection.prototype.parse = function(response) {
    console.log('parsing collection...');
    if (!response)
      return;

    if (response.included)
      Backbone.modelFactory.createFromArray(response.included);

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    if (!response.data) {
      return response;
    }

    return response.data;
  };

  Backbone.Relational.Model.prototype.parse = function(response) {
    console.log('parsing model...');
    if (!response)
      return;

    if (response.included)
      Backbone.modelFactory.createFromArray(response.included);

    if (response.data) {
      response = response.data;
    }

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    var data = response.attributes || {};
    data.id = response.id;

    if (response.relationships) {
      var simplifiedRelations = _.mapObject(response.relationships, function(value) {
        return value.data;
      });

      _.extend(data, simplifiedRelations);
    }

    return data;
  };
};
