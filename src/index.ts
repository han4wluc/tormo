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

interface RepositoryOptions {
  className: string
}

export class Repository {

  private className: string;
  private AVObject: any;
  constructor(public Class: any, options: RepositoryOptions) {
    this.className = options.className;
    this.AVObject = AV.Object.extend(options.className);
  }

  create = (attributes: Object) => {
    const person = new this.Class();
    Object.assign(person, attributes);
    return person;
  };

  save = async (person: any) => {
    const avObject = new this.AVObject(person)
    await avObject.save();
    avObjectToEntity(avObject, person)
    return person;
  };

  update = async (id: string, params: any) => {
    let avObject = AV.Object.createWithoutData(this.className, id);
    await avObject.save(params);
    const person = new this.Class();
    avObjectToEntity(avObject, person)
    return person;
  };

  find = async (params: any) => {
    var query = new AV.Query(this.className);
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
    const query = new AV.Query(this.className);

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
    const avObject = AV.Object.createWithoutData(this.className, id);
    await avObject.destroy();
  };

  jsonify = (instance: any) => {
    return Object.assign({}, instance)
  };
}
