export const getPresident = (companyId, players, portfolio) => {
  let maxShares = 0;
  let presidentId = null;
  Object.keys(players).forEach(pid => {
    const count = portfolio[pid]?.[companyId] || 0;
    if (count > maxShares) {
      maxShares = count;
      presidentId = pid;
    }
  });
  return presidentId;
};
