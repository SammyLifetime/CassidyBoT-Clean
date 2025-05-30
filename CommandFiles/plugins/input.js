/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/
const { censor } = require("fca-liane-utils");
const { stringArrayProxy } = global.utils;
export const meta = {
  name: "input",
  author: "Liane Cagara",
  version: "1.2.0",
  description: "All inputs are here, very easier to use, has more usages too!",
  supported: "^1.0.0",
  order: 1,
  IMPORTANT: true,
  type: "plugin",
};
export function use(obj) {
  const { ADMINBOT, MODERATORBOT } = global.Cassidy.config;

  try {
    obj.censor = censor;
    const { event, api } = obj;
    event.originalBody = `${event.body}`;
    event.body ||= "";
    if (obj.command?.meta?.autoCensor) {
      event.body = censor(event.body);
    }
    let { body = "" } = event;
    body = body.replace(/\[uid\]/gi, event.senderID);
    body = body.replace(
      /\[thisid\]/gi,
      event.messageReply?.senderID || event.senderID,
    );
    let [, ...args6] = body.split(" ").filter((i) => !!i);
    const args = stringArrayProxy(args6);
    args.original = stringArrayProxy(
      event.originalBody
        .split(" ")
        .filter((i) => !!i)
        .slice(1),
    );
    obj.args = args;
    const argPipe = stringArrayProxy(
      args
        .join(" ")
        .split("|")
        .map((i) => i.trim()),
    );
    const argArrow = stringArrayProxy(
      args
        .join(" ")
        .split("=>")
        .map((i) => i.trim()),
    );
    const wordCount = body.split(" ").filter((i) => !!i).length;
    const charCount = body.split("").filter((i) => !!i).length;
    const allCharCount = body.length;
    const links = body.match(/(https?:\/\/[^\s]+)/g);
    const mentionNames = body.match(/@[^\s]+/g);
    const numbers = body.match(/\d+/g);

    const words = stringArrayProxy(body.split(" ").filter((i) => !!i));
    const inp = {
      ...event,
      arguments: args,
      argPipe,
      argPipeArgs: argPipe?.map(
        (item) => item.split(" ").filter((i) => !!i) || [],
      ),
      argArrowArgs: argArrow?.map(
        (item) => item.split(" ").filter((i) => !!i) || [],
      ),
      argArrow,
      wordCount,
      charCount,
      splitBody(splitter, str = body) {
        return str
          .replaceAll(`\\${splitter}`, "x69_input")
          .split(splitter)
          .map((i) => i.trim())
          .map((i) => i.replaceAll("x69_input", splitter))
          .filter(Boolean);
      },
      splitArgs(splitter, arr = args) {
        return arr
          .join(" ")
          .replaceAll(`\\${splitter}`, "x69_input")
          .split(splitter)
          .map((i) => i.trim())
          .map((i) => i.replaceAll("x69_input", splitter))
          .filter(Boolean);
      },
      words,
      allCharCount,
      links,
      text: body,
      mentionNames,
      numbers,
      test(reg) {
        let regex = reg;
        if (typeof reg === "string") {
          regex = new RegExp(reg, "i");
        }
        return regex.test(body);
      },
      get isAdmin() {
        return ADMINBOT.includes(event.senderID);
      },
      get isModerator() {
        return (
          MODERATORBOT.includes(event.senderID) &&
          !ADMINBOT.includes(event.senderID)
        );
      },
      _isAdmin(uid) {
        return ADMINBOT.includes(uid);
      },
      _isModerator(uid) {
        return MODERATORBOT.includes(uid) && !ADMINBOT.includes(uid);
      },
      userInfo() {
        return new Promise(async (resolve) => {
          const info = await api.getUserInfo(event.senderID);
          resolve(info);
        });
      },
      sid: event.senderID,
      tid: event.threadID,
      replier: event.messageReply,
      hasMentions: Object.keys(event.mentions || {}).length > 0,
      firstMention: event.mentions
        ? {
            ...event.mentions[Object.keys(event.mentions)[0]],
            name: Object.keys(event.mentions)[0]?.replace("@", ""),
          }
        : null,
      isThread: event.senderID !== event.threadID,
      get detectUID() {
        if (Object.keys(event.mentions || {}).length > 0) {
          return Object.keys(event.mentions)[0];
        }
        if (event.messageReply) {
          return event.messageReply.senderID;
        }
      },
      get detectID() {
        return this.detectUID;
      },
      censor,
    };
    function bodyHas(str) {
      const string = String(str);
      return body.includes(string);
    }
    //let input = assignProp(bodyHas, inp);
    obj.input = inp;
    //console.log({ ...inp, participantIDs: "Hidden" })
    console.log({
      ...event,
      participantIDs: "Hidden",
    });
    obj.next();
  } catch (error) {
    console.log(error);
    obj.next();
  }
}
function assignProp(func, obj) {
  const wrapper = (...args) => {
    return func(...args);
  };

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      wrapper[key] = obj[key];
    }
  }

  return wrapper;
}
