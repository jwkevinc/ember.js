import Ember from 'ember-metal/core';

import merge from "ember-metal/merge";
import create from 'ember-metal/platform/create';
import { get } from "ember-metal/property_get";
import { set } from "ember-metal/property_set";
import {
  addObserver,
  removeObserver
} from "ember-metal/observer";
import Stream from "ember-metal/streams/stream";
import { read, isStream  } from "ember-metal/streams/utils";

function KeyStream(source, key) {
  Ember.assert("KeyStream error: source must be a stream", isStream(source)); // TODO: This isn't necessary.
  Ember.assert("KeyStream error: key must be a non-empty string", typeof key === 'string' && key.length > 0);
  Ember.assert("KeyStream error: key must not have a '.'", key.indexOf('.') === -1);

  // used to get the original path for debugging and legacy purposes
  var label = labelFor(source, key);

  this.init(label);
  this.path = label;
  this.source = this.addDependency(source);
  this.observedObject = null;
  this.key = key;
}

function labelFor(source, key) {
  return source.label ? source.label + '.' + key : key;
}

KeyStream.prototype = create(Stream.prototype);

merge(KeyStream.prototype, {
  compute() {
    var object = read(this.source);
    if (object) {
      return get(object, this.key);
    }
  },

  setValue(value) {
    var object = read(this.source);
    if (object) {
      set(object, this.key, value);
    }
  },

  setSource(source) {
    this.source.replace(source);
    this.notify();
  },

  revalidate() {
    var object = this.source.value();
    if (object !== this.observedObject) {
      this.deactivate();

      if (object && typeof object === 'object') {
        addObserver(object, this.key, this, this.notify);
        this.observedObject = object;
      }
    }
  },

  deactivate() {
    if (this.observedObject) {
      removeObserver(this.observedObject, this.key, this, this.notify);
      this.observedObject = null;
    }
  }
});

export default KeyStream;
