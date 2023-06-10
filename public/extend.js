// sort function for tag groups
var apisSorter = {
  unsorted: null,
  alpha: 'alpha'
};

// sort function for api endpoints within groups
var operationsSorter = {
  unsorted: null,
  alpha: 'alpha',
  method: 'method',
  ordered: function(a, b) {
    if (a.get('operation').get('x-order') < b.get('operation').get('x-order')) return -1;
    if (a.get('operation').get('x-order') > b.get('operation').get('x-order')) return 1;
    return 0;
  }
};
