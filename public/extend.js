// sort function for tag groups
var apisSorter = {
  alpha: 'alpha',
  default: function(a, b) {
    if (tags.indexOf(a.name) > -1 && tags.indexOf(b.name) > -1) {
      if (tags.indexOf(a.name) < tags.indexOf(b.name)) return -1;
      if (tags.indexOf(a.name) > tags.indexOf(b.name)) return 1;
    }
    return 0;
  }
};

// sort function for api endpoints within groups
var operationsSorter = {
  alpha: 'alpha',
  method: 'method',
  ordered: function(a, b) {
    if (a.get('operation').get('x-order') < b.get('operation').get('x-order')) return -1;
    if (a.get('operation').get('x-order') > b.get('operation').get('x-order')) return 1;
    return 0;
  }
};
