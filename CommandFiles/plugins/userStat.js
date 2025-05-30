export const meta = {
  name: "userStat",
  author: "Liane Cagara",
  version: "1.2.0",
  description: "Nothing special.",
  supported: "^1.0.0",
  order: 1,
  type: "plugin",
};

class CassEncoder {
  static encodeID(id) {
    try {
      const encodedID = Buffer.from(`custom_${id}`)
        .toString("base64")
        .replace(/\+/g, "0")
        .replace(/\//g, "1")
        .replace(/=/g, "");
      
      return `web:${encodedID}`;
    } catch (error) {
      return id;
    }
  }

  static decodeID(encodedID) {
    try {
      if (!encodedID.startsWith("web:")) {
        return encodedID;
      }
      
      const base64String = encodedID.slice(4);
      
      const padding = (4 - (base64String.length % 4)) % 4;
      const paddedBase64String = base64String + "=".repeat(padding);
      const decodedBuffer = Buffer.from(paddedBase64String, "base64");
      const decodedID = decodedBuffer.toString("utf-8");
      
      return decodedID.replace(/^custom_/, '');
    } catch (error) {
      return encodedID;
    }
  }

  static processID(data) {
    return Object.fromEntries(
      Object.entries(data).map(([a, b]) => [CassEncoder.encodeID(a), b])
    );
  }

  static unProcessID(data) {
    return Object.fromEntries(
      Object.entries(data).map(([a, b]) => [CassEncoder.decodeID(a), b])
    );
  }
}

class UserStatsLocal {
  constructor(objectData = {}) {
    this.objectData = objectData;
    this.defaults = {
      money: 0,
      exp: 0,
    };
    this.modifiedProperties = {};
  }

  
  process(data) {
    data ??= {};
    data.money ??= 0;
    data.money = data.money <= 0 ? 0 : parseInt(data.money);
    if (data.money > Number.MAX_SAFE_INTEGER) {
      data.money = Number.MAX_SAFE_INTEGER;
    }
    data.battlePoints ??= 0;
    data.battlePoints = data.battlePoints <= 0 ? 0 : parseInt(data.battlePoints);
    data.exp ??= 0;
    data.inventory ??= [];
    if (isNaN(data.exp)) {
      data.exp = 0;
    }
    if (data.name) {
      data.name = data.name.trim();
    }
    return data;
  }

  calcMaxBalance(users, specificID) {
    const balances = Object.keys(users)
      .filter(id => id !== specificID)
      .map(id => users[id].money);

    const totalBalance = balances.reduce((sum, balance) => parseInt(sum) + balance, 0);
    return Math.floor(10 * (totalBalance / balances.length));
  }

  get(key) {
    key = CassEncoder.decodeID(key);
    return JSON.parse(JSON.stringify(this.process(this.objectData[key] || { ...this.defaults, lastModified: Date.now() })));
  }

  deleteUser(key) {
    key = CassEncoder.decodeID(key);
    if (this.objectData[key]) {
      this.modifiedProperties[key] = JSON.parse(JSON.stringify(this.objectData[key]));
    }
    delete this.objectData[key];
  }

  remove(key, removedProperties = []) {
    key = CassEncoder.decodeID(key);
    const user = this.get(key);
    for (const item of removedProperties) {
      delete user[item];
    }
    this.objectData[key] = user;
    this.modifiedProperties[key] = JSON.parse(JSON.stringify(user));
    return this.getAll();
  }

  set(key, updatedProperties = {}) {
    key = CassEncoder.decodeID(key);
    const user = this.get(key);
    const updatedUser = { ...user, ...updatedProperties, lastModified: Date.now() };
    this.objectData[key] = updatedUser;
    this.modifiedProperties[key] = JSON.parse(JSON.stringify(updatedUser));
  }

  getAll() {
    const result = {};
    for (const key in this.objectData) {
      result[CassEncoder.encodeID(key)] = JSON.parse(JSON.stringify(this.process(this.objectData[key])));
    }
    return result;
  }

  toLeanObject() {
    const resultObj = {};
    for (const key in this.objectData) {
      resultObj[CassEncoder.encodeID(key)] = JSON.parse(JSON.stringify(this.objectData[key]));
    }
    return resultObj;
  }
        }

import UserInfo from "../resources/userInfo/utils.js";
import CurrencyHandler from "../resources/balance/utils.js";

import BankHandler from "../resources/bank/utils.js";

import GenericInfo from "../resources/generic/utils.js";
let handleStat;
let UserStatsManager;

import GenericOnline from "../resources/genericOnline/utils.js";
const userState = new GenericInfo({
  basename: "userstate",
  defaults: {
    isBanned: false,
    disallowed: [],
    banned: {
      reason: "",
      date: 0,
    },
    isMuted: false,
    muted: {
      reason: "",
      date: 0,
    },
    isBannedThread: false,
    bannedThread: {
      reason: "",
      date: 0,
    },
  },
});
const threadState = new GenericInfo({
  basename: "threadstate",
  defaults: {
    isBanned: false,
    disallowed: [],
    banned: {
      reason: "",
      date: 0,
    },
    isMuted: false,
    muted: {
      reason: "",
      date: 0,
    },
    isBannedThread: false,
    bannedThread: {
      reason: "",
      date: 0,
    },
  },
});
let userInfos;

export async function load() {
  UserStatsManager = (
    await global.requireEsm("./handlers/database/handleStat.mjs")
  ).default;
  handleStat = new UserStatsManager("handlers/database/userStat.json");
  global.handleStat = handleStat;
  await handleStat.connect();
  //await userInfos.connectMongo();
}

export async function use(obj) {
  //await threadState.connect();
  //await userState.connect();
  obj.CassEncoder = CassEncoder;
  userInfos = new UserInfo({
    filepath: "CommandFiles/resources/userInfo/userInfo.json",
    api: null,
    discordApi: null,
  });
  obj.UserStatsLocal = UserStatsLocal;
  userInfos.api = obj.api;
  userInfos.discordApi = obj.discordApi;
  global.userInfos = userInfos;
  if (true) {
    const { event } = obj;
    if (event.localDB === true) {
      const { databaseData = {} } = event;
      obj.money = new UserStatsLocal(JSON.parse(JSON.stringify(databaseData)));
    } else {
      
  obj.money = global.handleStat;
    }
  }
  obj.userState = userState;
  obj.threadState = threadState;

  obj.GenericInfo = GenericInfo;
  obj.userInfos = userInfos;
  obj.currencyHander = new CurrencyHandler({
    filepath: "CommandFiles/resources/balance/currency.json",
  });
  obj.bankHandler = new BankHandler({
    filepath: "CommandFiles/resources/bank/bank.json",
  });
  obj.threadConfig = new CurrencyHandler({
    filepath: "CommandFiles/resources/balance/threadConfig.json",
  });

  obj.userStat = obj.money;
  obj.next();
}
