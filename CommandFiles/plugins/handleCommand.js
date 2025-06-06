/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/
global.listener = {};
import { LianeAPI } from "fca-liane-utils";
import axios from "axios";

export const meta = {
  name: "handleCommand",
  author: "Liane Cagara",
  description:
    "This is where commands are usually handled, and it is handled at the last",
  version: "1.0.0",
  supported: "^1.0.0",
  IMPORTANT: true,
  type: "plugin",
};

const { Cooldown } = global.utils;
const handleCD = new Cooldown();
export async function use(obj) {
  try {
    const {
      awaitStack,
      hasAwaitStack,
      setAwaitStack,
      delAwaitStack,
      clearCurrStack,
    } = obj;
    obj.isCommand = true;
    function handleNo() {
      if (obj.input.xQ) {
        return;
      }
      if (global.webQuery[obj.input.webQ]) {
        global.webQuery[obj.input.webQ].resolve({
          status: "fail",
          result: {
            body: "Please type 'prefix'.",
            messageID: Date.now().toString(),
          },
          newMid: 0,
        });
      }
    }
    const isFn = (i) => typeof i === "function";
    let {
      api,
      event,
      commands,
      prefix,
      input,
      output,
      userState,
      commandName,
      hasPrefix,
      command,
      invTime,
      GenericInfo,
      moreAlias,
      Shop,
    } = obj;
    global.runner = obj;
    const {
      text,
      wordCount,
      charCount,
      allCharCount,
      numbers,
      links,
      mentionNames,
      replier,
      isThread,
      userInfo,
      hasMentions,
      body,
      senderID,
      threadID,
      argPipe,
      argArrow,
      arg,
      arguments: args,
    } = input;
    try {
      for (const key in global.listener) {
        async () => {
          try {
            let { regex, callback } = global.listener[key];
            if (typeof regex === "string") {
              regex = new RegExp(regex, "i");
            }
            if (regex.test(body)) {
              await callback({ ...obj, match: regex.exec(body) });
            }
          } catch (error) {
            console.log(error);
          }
        };
      }
    } catch (err) {
      console.log(err);
    }
    const { send, reply, react } = output;
    let eventTypes = ["message", "message_reply"];
    global.currData = command;

    if (!eventTypes.includes(event.type)) {
      handleNo();
      return;
    }
    if (hasPrefix && String(commandName).includes(".")) {
      return reply(
        `⚠️ | Commands with dot notation are **no longer supported** and even discouraged, instead use "${prefix}${String(commandName).replaceAll(".", "-")} ${args.join(" ")}"`,
      );
    }

    if (!command) {
      if (!hasPrefix) {
        handleNo();
        return;
      }
      if (prefix === "/") {
        return;
      }
      const [id, username = "unregistered"] = `${commandName}`.split("@");
      const key = `${id}@${username}`;
      try {
        const { data: aiInfos } = await axios.get(
          `${global.lia}/api/myai?type=mapped&c=only`,
        );
        if (key in aiInfos) {
          const ai = new LianeAPI(id, username);
          await output.reaction("⏳");
          const answer = await ai.ask(args.join(" "));
          output.reaction("✅");
          return reply(`${answer}

Note: The command "${commandName}" does not exist as a command.

Installation: ${global.lia}/raw/${username}@${id}?type=cassidy`);
        } else {
          console.log(`Ai not found for ${key}`);
        }
      } catch (error) {
        console.log(error);
      }

      return reply(
        `⚠️ | The command ${
          commandName ? `"${commandName}"` : "you are using"
        } does not exist${
          commands.help
            ? `, please check the command list by typing ${prefix}help`
            : ". The help command is missing anyway, so you're screwed."
        }`,
      );
    }
    async function isThreadAdmin(uid) {
      const { adminIDs = [], userInfo } = await api.getThreadInfo(threadID);
      if (adminIDs.includes(uid)) {
        return userInfo[uid];
      } else {
        return null;
      }
    }
    obj.isThreadAdmin = isThreadAdmin;

    const {
      meta,
      entry,
      cooldown,
      noPermission,
      noPrefix,
      needPrefix,
      banned,
      indivMeta = {},
      shopLocked,
      awaiting,
    } = command;
    console.log(`Handling command "${meta.name}"`);
    // if (hasAwaitStack(input.senderID, meta.name)) {
    //   if (isFn(awaiting)) {
    //     return awaiting(obj);
    //   }
    //   return output.reply(
    //     `⚠️ | The command "${meta.name}" is currently running, please wait.`,
    //   );
    // }
    const isShopUnlocked = await Shop.isUnlocked(meta.name, input.senderID);
    if (!isShopUnlocked) {
      const price = Shop.getPrice(meta.name);
      shopLabel: {
        if (price <= 0) {
          break shopLabel;
        }
        const isAffordable = await Shop.canPurchase(meta.name, input.senderID);

        if (isFn(shopLocked)) {
          obj.isAffordable = isAffordable;
          obj.thisPrice = price;
          return shopLocked(obj);
        }
        let text = `🔒 | The command "${meta.name}" is available in the **shop** with a price of ${price}$`;
        if (isAffordable) {
          text += `\n\n✨ You have enough money to **purchase** this command!\n\n**Example**: ${prefix}shop-cmd buy ${meta.name}`;
        }
        await output.reply(text);
        return;
      }
    }
    function handleArgs() {
      const args = input.arguments;
      const { args: neededArgs } = meta;
      if (!neededArgs) {
        return false;
      }
      for (const requirement of neededArgs) {
        const {
          degree = 0,
          fallback,
          response,
          search = "",
          required = false,
        } = requirement || {};
        if (
          search instanceof RegExp
            ? args[degree].match(search)
            : Array.isArray(search)
              ? search.includes(args[degree])
              : args[degree] === search
        ) {
          if (response === null || response) {
            response ? output.reply(response) : output.syntaxError(command);
            return true;
          } else {
            return false;
          }
        } else {
          if (fallback === null || fallback) {
            fallback ? output.reply(fallback) : output.syntaxError(command);
            return true;
          } else {
            return false;
          }
        }
      }
    }
    if (handleArgs()) {
      return;
    }
    const user = userState.get(senderID) || {};
    if (user.isBanned) {
      if (isFn(banned)) {
        return await banned(obj);
      }
      return reply(`⚠️ | You have been banned from using the bot!
UID: ${senderID}
Reason: ${user.banned?.reason || "No reason provided"}
Date: ${new Date(user.banned?.date).toLocaleString()}`);
    }

    if (meta.noPrefix === false && !hasPrefix) {
      if (isFn(needPrefix)) {
        return await needPrefix(obj);
      }
      return reply(`⚠️ | Please type ${prefix}${meta.name} to use this command.`);
    }
    if (meta.noPrefix === "both") {
      if (input.strictPrefix && !hasPrefix) {
        return reply(
          `⚠️ | Noprefix commands are not available, please type ${prefix}${meta.name} to use this command.`,
        );
      }
    } else if (hasPrefix && meta.noPrefix === true && !input.strictPrefix) {
      if (isFn(noPrefix)) {
        return await noPrefix(obj);
      }
      return reply(
        `⚠️ | The command ${commandName} has noPrefix configured as true.`,
      );
    } else if (
      meta.noPrefix !== false &&
      meta.noPrefix !== true &&
      meta.noPrefix !== "both"
    ) {
      return reply(
        `⚠️ | The noPrefix of the command ${commandName} isn't properly configured to true, false or "both"`,
      );
    }
    if (meta.noWeb && input.isWeb) {
      if (isFn(command.noWeb)) {
        return await command.noWeb(obj);
      }
      return reply(`⚠️ | The command "${commandName}" is not available in web.`);
    }
    if (Array.isArray(meta.whiteList) && !meta.whiteList.includes(senderID)) {
      if (isFn(noPermission)) {
        return await noPermission(obj);
      }
      return reply(
        `❌ | You are not allowed to use this command, contact the admin to add you to the whitelist.`,
      );
    }

    const { ADMINBOT } = global.Cassidy.config;
    if (!meta.permissions) {
      meta.permissions = [];
    }
    if (!meta.permissions?.includes(0) && meta.permissions?.includes(1)) {
      const info = await isThreadAdmin(senderID);
      if (!info) {
        if (isFn(noPermission)) {
          return await noPermission(obj);
        }
        return reply(`❌ | Only gc admins are allowed to use this command.`);
      }
    }
    const isAdmin = (ID) => ADMINBOT.includes(ID);
    if (
      (!meta.permissions?.includes(0) &&
        !meta.permissions?.includes(1) &&
        !isAdmin(senderID)) ||
      (meta.botAdmin && !isAdmin(senderID))
    ) {
      if (input.isModerator) {
        if (!meta.allowModerators) {
          if (isFn(command.modLower)) {
            return await command.modLower(obj);
          }
          if (isFn(noPermission)) {
            return await noPermission(obj);
          }
          return reply(
            `❌ | Moderators cannot use this command as it requires a higher permission.`,
          );
        }
      } else {
        if (isFn(noPermission)) {
          return await noPermission(obj);
        }
        return reply(`❌ | Only bot admins are allowed to use this command.`);
      }
    }

    const cooldownKey = `${senderID}_${meta.name}`;
    if (!meta.waitingTime) {
      meta.waitingTime = 5;
    }

    if (handleCD.isActive(cooldownKey)) {
      if (isFn(cooldown)) {
        obj.cooldown = handleCD.remainingTime(cooldownKey);
        return await cooldown(obj);
      }
      return reply(
        `⏱️ | Please wait for ${handleCD.remainingTime(cooldownKey)} seconds before using this command again.`,
      );
    }
    obj.recall = recall;
    async function recall() {
      await handleEntry();
    }
    let willCooldown = true;
    obj.cancelCooldown = () => {
      willCooldown = false;
    };
    let customCooldown = null;
    obj.setCooldown = (time) => {
      customCooldown = time;
    };
    async function handleEntry() {
      if (isFn(entry)) {
        const { params = [] } = meta;
        for (const paramKey in params) {
          if (!params) {
            break;
          }
          const currentValue = input.arguments[paramKey] || "";
          const paramValue = params[paramKey];
          const paramNum = parseInt(paramKey) + 1;
          if (Array.isArray(paramValue) && paramValue.includes(currentValue)) {
            // do nothing lmfao
          } else if (
            !!paramValue === !!currentValue &&
            paramValue !== undefined
          ) {
            // do nothing again.
          } else if (currentValue && paramValue === false) {
            return reply(
              `❌ | The parameter ${paramNum} doesn't expect a value.

${prefix}${commandName} ${args.slice(0, paramNum).join(" ")} <= HERE`,
            );
          } else {
            return reply(
              `❌ | The parameter ${paramNum} expects a value${Array.isArray(paramValue) ? ` (${paramValue.join(", ")})` : ""}, received ${currentValue ? `"${currentValue}"` : "nothing."}

${prefix}${commandName} ${args.slice(0, paramNum - 1).join(" ")} <= HERE`,
            );
          }
        }
        setAwaitStack(input.senderID, meta.name);
        try {
          await entry(obj);
        } catch (error) {
          delAwaitStack(input.senderID, meta.name);

          throw error;
        }
        delAwaitStack(input.senderID, meta.name);
        if (willCooldown) {
          handleCD.push(customCooldown ?? meta.waitingTime, cooldownKey);
        }
        return;
      }

      if (typeof entry !== "object") {
        await reply(`❌ | The entry function/object is corrupted.`);
        return;
      }
      const list = Object.keys(entry)
        .map((key) => {
          const { description } = indivMeta?.[key] || {};
          return `${prefix}${commandName}-${key}${description ? ` - ${description}` : ""}`;
        })
        .join("\n");
      const listText = `🔎 Found ${Object.keys(entry).length} command${Object.keys(entry).length > 1 ? "s" : ""}.

${list}`;
      for (const prop in entry) {
        if (!input.property[prop.trim()]) {
          continue;
        } else {
          const propEntry = entry[prop];
          const { params = [], waitingTime = meta.waitingTime } =
            indivMeta?.[prop] || {};

          for (const paramKey in params) {
            if (!params) {
              break;
            }
            const currentValue = input.arguments[paramKey] || "";
            const paramValue = params[paramKey];
            const paramNum = parseInt(paramKey) + 1;
            if (
              Array.isArray(paramValue) &&
              paramValue.includes(currentValue)
            ) {
              // do nothing lmfao
            } else if (
              !!paramValue === !!currentValue &&
              paramValue !== undefined
            ) {
              // do nothing again.
            } else if (currentValue && paramValue === false) {
              return reply(
                `❌ | The parameter ${paramNum} doesn't expect a value.

${prefix}${commandName}.${prop} ${args.slice(0, paramNum).join(" ")} <= HERE`,
              );
            } else {
              return reply(
                `❌ | The parameter ${paramNum} expects a value${Array.isArray(paramValue) ? ` (${paramValue.join(", ")})` : ""}, received ${currentValue ? `"${currentValue}"` : "nothing."}

${prefix}${commandName}.${prop} ${args.slice(0, paramNum - 1).join(" ")} <= HERE`,
              );
            }
          }

          if (typeof propEntry === "function") {
            setAwaitStack(input.senderID, meta.name);

            try {
              await propEntry(obj);
            } catch (error) {
              delAwaitStack(input.senderID, meta.name);

              throw error;
            }
            delAwaitStack(input.senderID, meta.name);

            if (willCooldown) {
              handleCD.push(customCooldown ?? waitingTime, cooldownKey);
            }
            return;
          } else if (typeof propEntry === "string") {
            return await reply(propEntry);
          } else {
            return await reply(
              `❌ | The entry function/string is corrupted in the key ${prop}.`,
            );
          }
        }
      }
      return obj.outputOld(listText, {
        isReply: true,
        defStyle: {
          title: `📂 ${commandName.toUpperCase()} MENU`,
          titleFont: "bold",
          contentFont: "fancy",
        },
      });
    }
    await handleEntry(obj);
  } catch (error) {
    console.log(error);
    const errorText = parseError(error);
    if (!obj.command && !obj.detectID) {
      return;
    }
    obj.output.reply(errorText);
  }
}

function parseError(err) {
  const date = new Date();
  const { getHours, getSeconds, getMinutes, getDate } = date;
  return `❌ | ${date.getDate()}\n${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} - ${err.message}\n\n${err.stack}`;
}

let _structure = {
  meta: {
    name: "name",
    author: "Your name",
    otherNames: ["name1", "name2"],
    version: "1.0.0",
    description: "Your description",
    usage: "{prefix}name <arg]",
    category: "your category",
    permissions: [0, 1, 2],
    //0 is non admin, 1 is gc admin, 2 is bot admin
    waitingTime: 5,
    noPrefix: "both", //both, true, false
    whiteList: null, //[]
    ext_plugins: {
      plugin_name: "^1.0.0",
    },
  },
};
