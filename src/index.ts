import AV from "leancloud-storage";

export function Column() {
  function deco(this: any, target: any, propertyName: string) {
    // property getter method
    const getter = () => {
      return target.avObject.get(propertyName);
    };

    // property setter method
    const setter = (newVal: any) => {
      target.avObject.set(propertyName, newVal);
    };

    // Delete property.
    if (delete target[propertyName]) {
      // Create new property with getter and setter
      Object.defineProperty(target, propertyName, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
      });
    }
  }
  return deco;
}

export function Entity() {
  function deco(target: any) {
    // save a reference to the original constructor
    const original = target;

    function construct(constructor: any, args: any) {
      // a utility function to generate instances of a class
      const c: any = function(this: any) {
        return constructor.apply(this, args);
      };
      c.prototype = constructor.prototype;
      return new c();
    }

    // the new constructor behaviour
    const f: any = function(...args: any) {
      const Class = AV.Object.extend(original["name"]);
      original.prototype.avObject = new Class();
      original.prototype.setAvObject = function(avObject: any) {
        original.prototype.avObject = avObject
      }
      return construct(original, args);
    };

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;
    Object.defineProperty(f, "name", {
      value: original["name"]
    });

    Object.defineProperty(original.prototype, 'id', {
      get: function(this: any) {
        return this.avObject ? this.avObject.id : undefined
      },
      enumerable: true,
      configurable: true
    });

    // return new constructor (will override original)
    return f;
  }
  return deco;
}


export class Repository {

  constructor(public Class: any) {}

  create = (attributes: Object) => {
    const person = new this.Class();
    Object.assign(person, attributes);
    return person;
  };

  save = async (person: any) => {
    await person.avObject.save();
    return person;
  };

  update = async (id: string, params: any) => {
    let avObject = AV.Object.createWithoutData(this.Class.name, id);
    await avObject.save(params);
    const person = new this.Class();
    person.setAvObject(avObject);
    return person;
  }

  find = async (params: any) => {
    var query = new AV.Query(this.Class.name);
    Object.entries(params).forEach(([key, value]) => {
      query.equalTo(key, value);
    });
    const avObjects = await query.find()
    return avObjects.map((avObject) => {
      const person: any = new this.Class();
      person.setAvObject(avObject)
      return person
    })
  }

  findOne = async (params: string | any) => {
    const query = new AV.Query(this.Class.name);

    if (typeof params === "string") {
      const id = params;
      const avObject = await query.get(id);
      const person = new this.Class();
      person.setAvObject(avObject);
      return person;
    }

    Object.entries(params).forEach(([key, value]) => {
      query.equalTo(key, value);
    });
    query.limit(1)

    const avObjects = await query.find()
    if (avObjects.length > 0) {
      const person: any = new this.Class();
      person.setAvObject(avObjects[0])
      return person
    }
  };

  remove = async (id: string) => {
    const avObject = AV.Object.createWithoutData(this.Class.name, id);
    await avObject.destroy();
  }

  jsonify = (instance: any) => {
    if (!instance.avObject) return {}
    return instance.avObject.toJSON()
  }
}

