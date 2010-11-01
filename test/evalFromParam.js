var evalStr = location.search.substring(1);
console.error("evalFromParam: " + evalStr);
console.log(location);
eval(evalStr);