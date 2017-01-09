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
      var attributes = data.attributes ? data.attributes : data;
      attributes.id = data.id;
      options = _.extend({parse: true}, options);
      if (this.registeredModels[type]){
        var model = this.registeredModels[type].findOrCreate(attributes, options);
        //console.log('RESULTING MODEL: ', model);
        if(model)
          return model;
      }
    }

    createFromArray(items, options, type){
      _.each(items, function(item) {
        type = item.type || type;
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

    if (response.meta && this.handleMeta)
      this.handleMeta(response.meta);

    var data = !response.attributes && !response.type ? response : response.attributes || {};
    data.id = response.id;

    if (response.relationships) {
      var simplifiedRelations = _.mapObject(response.relationships, function(value) {
        //we need to strip the types out so we don't end up with weird attributes.
        /*if (Array.isArray(value.data)){
          for (var item in value.data){
            delete value.data[item]['type'];
          }
        } else {
          delete value.data.type;
        }*/
        //console.log('relationship meta: ', value);
        return value.data;
      });

      _.extend(data, simplifiedRelations);
    }

    return data;
  };

  return Backbone;
}
