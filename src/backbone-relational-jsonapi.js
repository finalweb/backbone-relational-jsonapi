'use strict';

export default function(Backbone, _){

  class ModelFactory{

    constructor(){
      this.registeredModels = {};
    }

    registerModel(model){
      this.registeredModels[model.prototype.defaults.type] = model;
    }

    findOrCreate(data, options, type){
      options = _.extend({parse: true}, options);
      if (this.registeredModels[data.type || type]){
        var model = this.registeredModels[data.type || type].findOrCreate(data, options);
        if(model)
          return model;
      }
    }

    createFromArray(items, options, type){
      _.each(items, function(item) {
        this.findOrCreate(item, options, type);
      }, this);
    }

  }

  Backbone.Relational.modelFactory = new ModelFactory();

  Backbone.Relational.Collection.prototype.parse = function(response, options) {
    var type = this.model.prototype.defaults.type;
    console.log('Parsing collection...', response);
    if (!response)
      return;

    if (response.data)
      Backbone.Relational.modelFactory.createFromArray(response.data, options, type);

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    if (!response.data) {
      return response;
    }

    return response.data;
  };

  Backbone.Relational.Model.prototype.parse = function(response, options) {
    console.log('Parsing model...', response);
    if (!response)
      return;

    if (response.included)
      Backbone.Relational.modelFactory.createFromArray(response.included, options);

    if (response.data) {
      response = response.data;
    }

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    var data = !response.attributes && !response.type ? response : response.attributes || {};
    data.id = response.id;

    if (response.relationships) {
      var simplifiedRelations = _.mapObject(response.relationships, function(value) {
        return value.data;
      });

      _.extend(data, simplifiedRelations);
    }

    console.log('Returning Model: ', data);

    return data;
  };

  return Backbone;
}
