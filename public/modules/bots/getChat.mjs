import chatData from './data/chats.json' with { type: 'json' };

const getChat = (action, target) => {
  const msgs = chatData[action];
  let msg = `Henlo ${target}, I don't know what to say!`;

  if (msgs && msgs.length) {
    msg = msgs[Math.floor(Math.random() * msgs.length)];
    msg = msg.replace('%TARGET%', target);
  }

  return msg;
}


export default getChat;
