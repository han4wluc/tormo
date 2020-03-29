import AV from "leancloud-storage";

export function Column() {
  function deco(this: any, target: any, propertyName: string) {
  }
  return deco;
}

export function Entity() {
  return function<T extends { new (...args: any[]): {} }>(_constructor: T) {
    return _constructor;
  };
}

function avObjectToEntity(avObject: any, entity: any) {
  Object.assign(entity, avObject.attributes)
  entity.id = avObject.id
}

export class Repository {
  constructor(public Class: any) {}

  create = (attributes: Object) => {
    const person = new this.Class();
    Object.assign(person, attributes);
    return person;
  };

  save = async (person: any) => {
    const AVObject = AV.Object.extend(this.Class.name);
    const avObject = new AVObject(person)
    await avObject.save();
    avObjectToEntity(avObject, person)
    return person;
  };

  update = async (id: string, params: any) => {
    let avObject = AV.Object.createWithoutData(this.Class.name, id);
    await avObject.save(params);
    const person = new this.Class();
    avObjectToEntity(avObject, person)
    return person;
  };

  find = async (params: any) => {
    var query = new AV.Query(this.Class.name);
    Object.entries(params).forEach(([key, value]) => {
      query.equalTo(key, value);
    });
    const avObjects = await query.find();
    return avObjects.map(avObject => {
      const person: any = new this.Class();
      avObjectToEntity(avObject, person)
      return person;
    });
  };

  findOne = async (params: string | any) => {
    const query = new AV.Query(this.Class.name);

    if (typeof params === "string") {
      const id = params;
      const avObject = await query.get(id);
      const person = new this.Class();
      avObjectToEntity(avObject, person)
      return person;
    }

    Object.entries(params).forEach(([key, value]) => {
      query.equalTo(key, value);
    });
    query.limit(1);

    const avObjects = await query.find();
    if (avObjects.length > 0) {
      const person: any = new this.Class();
      avObjectToEntity(avObjects[0], person)
      return person;
    }
  };

  remove = async (id: string) => {
    const avObject = AV.Object.createWithoutData(this.Class.name, id);
    await avObject.destroy();
  };

  jsonify = (instance: any) => {
    return Object.assign({}, instance)
  };
}
