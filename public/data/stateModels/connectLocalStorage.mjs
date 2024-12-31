export const connectLocalStorage = (key) => {
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  return {
    get: (id) => data[id],
    set: (id, values) => {
      if (values === null) {
        delete data[id];
      } else {
        data[values.id] = values;
      }

      localStorage.setItem(key, JSON.stringify(data));
      return values;
    },
    list: () => Object.values(data),
    loose: true,
  };
};
