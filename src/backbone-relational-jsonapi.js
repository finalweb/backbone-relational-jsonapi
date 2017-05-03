'use strict';

export default function(Backbone, _){

  class ModelFactory{

    constructor(){
      this.registeredModels = {};
    }

    registerModel(model){
      this.registeredModels[model.prototype.defaults.type] = model;
    }

    getSimplifiedRelations(relationships){
      if (relationships) {
        var simplifiedRelations = _.mapObject(relationships, function(value) {
          return value.data;
        });
        var meta = _.mapObject(relationships, function(value) {
          return value.meta;
        });
        return {models: simplifiedRelations, meta: meta};
      } else {
        return {};
      }
    }

    findOrCreate(data, options, type){
      var attributes = data.attributes ? data.attributes : data;
      attributes.id = data.id;
      var relations = this.getSimplifiedRelations(data.relationships);
      _.extend(attributes, relations.models);

      //console.log('FIND OR CREATE: ', attributes);

      options = _.extend({parse: true}, options);
      if (this.registeredModels[type]){
        var model = this.registeredModels[type].findOrCreate(attributes, options);
        //console.log('RESULTING MODEL: ', model);
        if(model){
          //handle the meta for each relationship
          _.each(relations.meta, (meta, key) => {
            if (model.get(key) && model.get(key).handleMeta){
              model.get(key).handleMeta(meta);
            }
          });
          return model;
        }
      }
    }

    createFromArray(items, options, type){
      _.each(items, function(item) {
        type = item.type || type;

        //console.log('CREATING: ', item);

        //delete item.type;
        this.findOrCreate(item, options, type);
      }, this);
    }

  }

  Backbone.Relational.modelFactory = new ModelFactory();

  Backbone.Relational.Collection.prototype.parse = function(response, options) {
    var type = this.model.prototype.defaults.type;
    //console.log('Parsing collection...', response);
    if (!response)
      return;

    if (response.included)
      Backbone.Relational.modelFactory.createFromArray(response.included, options, type);

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    if (!response.data) {
      return response;
    }

    Backbone.Relational.modelFactory.createFromArray(response.data, options, type);

    return response.data;
  };

  Backbone.Relational.Model.prototype.parse = function(response, options) {
    //console.log('Parsing model...', response);
    if (!response)
      return;

    if (response.included)
      Backbone.Relational.modelFactory.createFromArray(response.included, options);

    if (response.data) {
      response = response.data;
    }

    if (response.meta && this.handleMeta){
      this.handleMeta(response.meta);
    }

    var data = !response.attributes && !response.type ? response : response.attributes || {};
    data.id = response.id;


    var rels = Backbone.Relational.modelFactory.getSimplifiedRelations(response.relationships);
    _.extend(data, rels.models);

    return data;
  };

  return Backbone;
}
