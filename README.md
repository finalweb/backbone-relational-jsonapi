# backbone-relational-jsonapi

Overloads `Backbone.Collection` and `Backbone.Relational.Model` `parse` methods to add compatibility with the [JSONapi](http://jsonapi.org/) protocol.

## Installation

    $ npm install backbone-relational-jsonapi

## Documentation

###Node

First, install the package:

    npm install backbone-relational-jsonapi --save-dev

Then require it:

    var _ = require('underscore'),
        Backbone = require('backbone');
    Backbone.Relational = require('backbone-relational');
    require('backbone-relational-jsonapi')(Backbone, _);

###Browser

First include the script after backbone and underscore.

    <script src="underscore.js"></script>
    <script src="backbone.js"></script>
    <script src="backbone-relational-jsonapi.js"></script>

Then boot it up.

    backboneRelationalJsonapi(Backbone, _);

## Currently supported

The library is currently able to parse

* The `data` object
* The `relationships` objects
* The `included` objects

### Parsing a compound object

To parse a compound object, the library first checks if something is present in the `included` object and creates the corresponding instances using the `id` and `type` attributes. To do this, it uses a common model factory that looks up the class names depending on the `type`.

In your classes, specify a default `type` value, like

    var Tag = Backbone.RelationalModel.extend({
        defaults: {
            type: 'tags'
        }
    }

and then register this class in the model factory, like

    Backbone.modelFactory.registerModel(Tag);

This way, compound objecs containing `tags` objects will be parsed and the included instances of `Tag` will be available to other objects for relationships.

## Meta objects

Meta objects are supported and their treatment is delegated to the model or collection that is parsing the incoming data. When a `meta` object is found within the response, the function `handleMeta` is called on `this`. If the function is not defined, then the `meta` object is ignored.
Be careful: this function is called before the `parse` function has actually returned, so you won't be able to access the parsed data from the `handeMeta` scope.

## Examples

Here's an example of an `articles` object that can be parsed by the library

    {
        "data": {
            "type": "articles",
            "id": "1",
            "attributes": {
                "title": "The title of the article",
                "url": "http://article.com/article-id",
                "date": 1423094400,
                "thumbnail": "thumbnail.png",
            },
        }
        "relationships": {
            "tags": {
                "data": [
                    {
                        "type": "tags",
                        "id": "10"
                    },
                ]
            }
        },
        "included": [
            {
                "type": "tags",
                "id": "10",
                "attributes": {
                  "name": "geeks"
                }
            }
        ]
    }

Which, Backbone-side would be expressed like

    var Article = Backbone.RelationalModel.extend({
        defaults: {
            type: 'articles'
        },
        relations: [{
            type: Backbone.HasMany,
            key: 'tags',
            relatedModel: Tag // Refers to the Tag class defined above
        }]
    });

## Not supported

Currently, the support of the JSONapi specification is partial. Work still needs to be done.

* Links
