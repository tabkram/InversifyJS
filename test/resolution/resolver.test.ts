///<reference path="../../typings/browser.d.ts" />

import { expect } from "chai";
import * as sinon from "sinon";
import Resolver from "../../src/resolution/resolver";
import Planner from "../../src/planning/planner";
import Kernel from "../../src/kernel/kernel";
import Request from "../../src/planning/request";
import Plan from "../../src/planning/plan";
import Target from "../../src/planning/target";
import Inject from "../../src/activation/inject";
import ParamNames from "../../src/activation/paramnames";
import * as ERROR_MSGS from "../../src/constants/error_msgs";
import BindingType from "../../src/bindings/binding_type";

describe("Resolver", () => {

  let sandbox: Sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("Should be able to resolve BindingType.Instance bindings", () => {

      interface IKatanaBlade {}
      class KatanaBlade implements IKatanaBlade {}

      interface IKatanaHandler {}
      class KatanaHandler implements IKatanaHandler {}

      interface IKatana {
          handler: IKatanaHandler;
          blade: IKatanaBlade;
      }

      @Inject("IKatanaHandler", "IKatanaBlade")
      @ParamNames("handler", "blade")
      class Katana implements IKatana {
          public handler: IKatanaHandler;
          public blade: IKatanaBlade;
          public constructor(handler: IKatanaHandler, blade: IKatanaBlade) {
              this.handler = handler;
              this.blade = blade;
          }
      }

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {
          katana: IKatana;
          shuriken: IShuriken;
      }

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              this.katana = katana;
              this.shuriken = shuriken;
          }
      }

      let ninjaId = "INinja";
      let shurikenId = "IShuriken";
      let katanaId = "IKatana";
      let katanaHandlerId = "IKatanaHandler";
      let katanaBladeId = "IKatanaBlade";

      let kernel = new Kernel();
      kernel.bind<INinja>(ninjaId).to(Ninja);
      kernel.bind<IShuriken>(shurikenId).to(Shuriken);
      kernel.bind<IKatana>(katanaId).to(Katana);
      kernel.bind<IKatanaBlade>(katanaBladeId).to(KatanaBlade);
      kernel.bind<IKatanaHandler>(katanaHandlerId).to(KatanaHandler);

      let _kernel: any = kernel;
      let ninjaBinding = _kernel._bindingDictionary.get(ninjaId)[0];
      let katanaBinding = _kernel._bindingDictionary.get(katanaId)[0];
      let katanaHandlerBinding = _kernel._bindingDictionary.get(katanaHandlerId)[0];
      let katanaBladeBinding = _kernel._bindingDictionary.get(katanaBladeId)[0];
      let shurikenBinding = _kernel._bindingDictionary.get(shurikenId)[0];

      let planner = new Planner();
      let context = planner.createContext(kernel);

      /* 
      *  Plan (request tree):
      *  
      *  Ninja (target "null", no metadata)
      *   -- Katana (target "katama", no metadata)
      *       -- KatanaHandler (target "blade", no metadata)
      *       -- KatanaBlade (target "blade", no metadata)
      *   -- Shuriken (target "shuriken", no metadata)
      */
      let ninjaRequest = new Request(ninjaId, context, null, ninjaBinding, null);
      let plan = new Plan(context, ninjaRequest);
      let katanaRequest = plan.rootRequest.addChildRequest(katanaId, katanaBinding, new Target("katana", katanaId));
      katanaRequest.addChildRequest(katanaHandlerId, katanaHandlerBinding, new Target("handler", katanaHandlerId));
      katanaRequest.addChildRequest(katanaBladeId, katanaBladeBinding, new Target("blade", katanaBladeId));
      plan.rootRequest.addChildRequest(shurikenId, shurikenBinding, new Target("shuriken", shurikenId));
      context.addPlan(plan);

      let resolver = new Resolver();
      let ninja = resolver.resolve<INinja>(context);

      expect(ninja instanceof Ninja).eql(true);
      expect(ninja.katana instanceof Katana).eql(true);
      expect(ninja.katana.handler instanceof KatanaHandler).eql(true);
      expect(ninja.katana.blade instanceof KatanaBlade).eql(true);
      expect(ninja.shuriken instanceof Shuriken).eql(true);

  });

  it("Should store singleton type bindings in cache", () => {

      interface IKatanaBlade {}
      class KatanaBlade implements IKatanaBlade {}

      interface IKatanaHandler {}
      class KatanaHandler implements IKatanaHandler {}

      interface IKatana {
          handler: IKatanaHandler;
          blade: IKatanaBlade;
      }

      @Inject("IKatanaHandler", "IKatanaBlade")
      @ParamNames("handler", "blade")
      class Katana implements IKatana {
          public handler: IKatanaHandler;
          public blade: IKatanaBlade;
          public constructor(handler: IKatanaHandler, blade: IKatanaBlade) {
              this.handler = handler;
              this.blade = blade;
          }
      }

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {
          katana: IKatana;
          shuriken: IShuriken;
      }

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              this.katana = katana;
              this.shuriken = shuriken;
          }
      }

      let ninjaId = "INinja";
      let shurikenId = "IShuriken";
      let katanaId = "IKatana";
      let katanaHandlerId = "IKatanaHandler";
      let katanaBladeId = "IKatanaBlade";

      let kernel = new Kernel();
      kernel.bind<INinja>(ninjaId).to(Ninja);
      kernel.bind<IShuriken>(shurikenId).to(Shuriken);
      kernel.bind<IKatana>(katanaId).to(Katana).inSingletonScope(); // SINGLETON!
      kernel.bind<IKatanaBlade>(katanaBladeId).to(KatanaBlade);
      kernel.bind<IKatanaHandler>(katanaHandlerId).to(KatanaHandler).inSingletonScope(); // SINGLETON!

      let _kernel: any = kernel;
      let ninjaBinding = _kernel._bindingDictionary.get(ninjaId)[0];
      let katanaBinding = _kernel._bindingDictionary.get(katanaId)[0];
      let katanaHandlerBinding = _kernel._bindingDictionary.get(katanaHandlerId)[0];
      let katanaBladeBinding = _kernel._bindingDictionary.get(katanaBladeId)[0];
      let shurikenBinding = _kernel._bindingDictionary.get(shurikenId)[0];

      let planner = new Planner();
      let context = planner.createContext(kernel);

      /* 
      *  Plan (request tree):
      *  
      *  Ninja (target "null", no metadata)
      *   -- Katana (target "katama", no metadata)
      *       -- KatanaHandler (target "blade", no metadata)
      *       -- KatanaBlade (target "blade", no metadata)
      *   -- Shuriken (target "shuriken", no metadata)
      */
      let ninjaRequest = new Request(ninjaId, context, null, ninjaBinding, null);
      let plan = new Plan(context, ninjaRequest);
      let katanaRequest = plan.rootRequest.addChildRequest(katanaId, katanaBinding, new Target("katana", katanaId));
      katanaRequest.addChildRequest(katanaHandlerId, katanaHandlerBinding, new Target("handler", katanaHandlerId));
      katanaRequest.addChildRequest(katanaBladeId, katanaBladeBinding, new Target("blade", katanaBladeId));
      plan.rootRequest.addChildRequest(shurikenId, shurikenBinding, new Target("shuriken", shurikenId));
      context.addPlan(plan);

      let resolver = new Resolver();
      let createInstanceSpy = sandbox.spy(resolver, "_createInstance");

      expect(_kernel._bindingDictionary.get("IKatana")[0].cache === null).eql(true);

      expect(createInstanceSpy.callCount).eql(0);
      let ninja = resolver.resolve<INinja>(context);
      expect(ninja instanceof Ninja).eql(true);
      expect(createInstanceSpy.callCount).eql(2);
      expect(createInstanceSpy.getCall(0).args[0].name === "Katana").eql(true);
      expect(createInstanceSpy.getCall(1).args[0].name === "Ninja").eql(true);

      let ninja2 = resolver.resolve<INinja>(context);
      expect(ninja2 instanceof Ninja).eql(true);
      expect(createInstanceSpy.callCount).eql(3);
      expect(createInstanceSpy.getCall(1).args[0].name === "Ninja").eql(true);

      expect(_kernel._bindingDictionary.get("IKatana")[0].cache instanceof Katana).eql(true);

  });

  it("Should throw when an invalid BindingType is detected", () => {

      interface IKatana {}
      class Katana implements IKatana {}

      interface IShuriken {}
      class Shuriken implements IShuriken {}

      interface INinja {
          katana: IKatana;
          shuriken: IShuriken;
      }

      @Inject("IKatana", "IShuriken")
      @ParamNames("katana", "shuriken")
      class Ninja implements INinja {
          public katana: IKatana;
          public shuriken: IShuriken;
          public constructor(katana: IKatana, shuriken: IShuriken) {
              this.katana = katana;
              this.shuriken = shuriken;
          }
      }

      // kernel and bindings
      let ninjaId = "INinja";
      let kernel = new Kernel();
      let _kernel: any = kernel;
      kernel.bind<INinja>(ninjaId); // IMPORTAN! (Invalid binding)
      let ninjaBinding = _kernel._bindingDictionary.get(ninjaId)[0];

      // context and plan
      let planner = new Planner();
      let context = planner.createContext(kernel);
      let ninjaRequest = new Request(ninjaId, context, null, ninjaBinding, null);
      let plan = new Plan(context, ninjaRequest);
      context.addPlan(plan);

      // resolver
      let resolver = new Resolver([]);
      let _resolver: any = resolver;
      let _inject = _resolver._inject;

      let throwFunction = () => {
          _inject(ninjaRequest);
      };

      expect(ninjaRequest.bindings[0].type).eql(BindingType.Invalid);
      expect(throwFunction).to.throw(`${ERROR_MSGS.INVALID_BINDING_TYPE} ${ninjaId}`);

  });

  it("Should be able to resolve BindingType.Value bindings");
  it("Should be able to resolve BindingType.Constructor bindings");
  it("Should be able to resolve BindingType.Factory bindings");
  it("Should be able to resolve BindingType.Provider bindings");

});
