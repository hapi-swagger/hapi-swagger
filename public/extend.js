

    // sort function for tag groups
    apisSorter = {
        default: function (a, b) {
            if(tags.indexOf(a.name) > -1 && tags.indexOf(b.name) > -1){
                if (tags.indexOf(a.name) < tags.indexOf(b.name)) return -1;
                if (tags.indexOf(a.name) > tags.indexOf(b.name)) return 1;
            }
            return 0;
        },
        name: function (a, b) {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        }
    }


    // sort function for api endpoints within groups
    operationsSorter = {
        ordered: function (a, b) {
            if (a.operation['x-order'] < b.operation['x-order']) return -1;
            if (a.operation['x-order'] > b.operation['x-order']) return 1;
            return 0;
        },
        path: function (a, b) {
            if (a.path < b.path) return -1;
            if (a.path > b.path) return 1;
            return 0;
        },
        method: function (a, b) {
            if (a.method < b.method) return -1;
            if (a.method > b.method) return 1;
            return 0;
        }
    }