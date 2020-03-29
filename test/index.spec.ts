import path from 'path'
import AV from "leancloud-storage";
import { assert } from "chai";
import { Entity, Column, Repository } from "../src/index";

const dotEnvPath = path.resolve('./test/.mocha.env');
require('dotenv').config({ path: dotEnvPath})  

@Entity()
class Person {
  @Column()
  firstName: string = "";
}

const repository = new Repository(Person);

const sleep = (seconds = 5000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds)
  })
}

describe("Repository", () => {
  before(() => {
    AV.init({
      appId: process.env.LEAN_CLOUD_APP_ID!,
      appKey: process.env.LEAN_CLOUD_APP_KEY!,
      serverURLs: process.env.LEAN_CLOUD_SERVER_URLS
    });
  })

  beforeEach(async function () {
    if (process.env.APP_ENV !== 'testing') {
      throw new Error('To run unit test, please set APP_ENV=testing')
    }
    this.timeout(25000);
    // retry multiple attemps in case Lean Cloud server is in cold start
    for (let i=0; i < 5; i++) {
      var query = new AV.Query("Person");
      try {
        await query.destroyAll();
        return
      } catch (error) {
        console.log('destoryAll failed', error)
        await sleep()
      }
    }
  });

  describe("create", () => {
    it("should create local object", () => {
      const person = repository.create({
        firstName: "hello"
      });
      assert.equal(person instanceof Person, true);
      assert.equal(person.firstName, "hello");
      assert.equal(person.id, undefined);
    });
  });

  describe("save", () => {
    it("should create and persist a user", async () => {
      const _person = new Person();
      _person.firstName = "hello";
      const person = await repository.save(_person);
      assert.equal(person instanceof Person, true);
      assert.equal(person.firstName, "hello");
      assert.equal(person.id.length, 24);

      const query = new AV.Query("Person");
      const count = await query.count();
      assert.equal(count, 1);
    });
  });

  describe("update", () => {
    let person: any;
    beforeEach(async () => {
      const _person = new Person();
      _person.firstName = "hello";
      person = await repository.save(_person);
    });
    it("should update a user", async () => {
      const udpatedPerson = await repository.update(person.id, {
        firstName: "wallo"
      });
      assert.equal(udpatedPerson.firstName, "wallo");
    });
  });

  describe("find", () => {
    beforeEach(async () => {
      const _person = new Person();
      _person.firstName = "hello";
      await repository.save(_person);
    });

    it("should find all results", async () => {
      const people = await repository.find({});
      assert.equal(people.length, 1);
      assert.equal(people[0] instanceof Person, true)
    })

    it("should not find any results", async () => {
      const people = await repository.find({
        firstName: " wallo"
      });
      assert.equal(people.length, 0);
    });

    it("shoud find results", async () => {
      const people = await repository.find({
        firstName: "hello"
      });
      assert.equal(people.length, 1);
      const person = people[0];
      assert.equal(person instanceof Person, true);
      assert.equal(person.firstName, "hello");
    });
  });

  describe("findOne", () => {
    beforeEach(async () => {
      const _person = new Person();
      _person.firstName = "hello";
      await repository.save(_person);
    });
    it("should not find any results", async () => {
      const people = await repository.findOne({
        firstName: " wallo"
      });
      assert.equal(people, undefined);
    });
    it("shoud find results", async () => {
      const person = await repository.findOne({
        firstName: "hello"
      });
      assert.equal(person instanceof Person, true);
      assert.equal(person.firstName, "hello");
    });
  });

  describe("remove", () => {
    let person: any;
    beforeEach(async () => {
      const _person = new Person();
      _person.firstName = "hello";
      person = await repository.save(_person);
    });
    it("should not find any results", async () => {
      const res = await repository.remove(person.id);
      assert.equal(res, undefined);

      const query = new AV.Query("Person");
      const count = await query.count();
      assert.equal(count, 0);
    });
  });

  describe("jsonify", () => {
    it("should return correct attributes", () => {
      const person = new Person();
      person.firstName = "hello";
      const personJson = repository.jsonify(person);
      assert.deepEqual(personJson, {
        firstName: "hello"
      });
    });

    it("should return correct attributes", async () => {
      const _person = new Person();
      _person.firstName = "hello";
      const person = await repository.save(_person);
      const personJson = repository.jsonify(person);

      assert.equal(personJson.objectId, person.id);
      assert.equal(personJson.firstName, person.firstName);
    });
  });
});
