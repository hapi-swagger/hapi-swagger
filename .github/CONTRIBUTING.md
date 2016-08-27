# Contributing Guidelines

# How to contribute
Contributions from the community are welcome.  Please follow this guide when logging issues or helping maintain the code.


# Logging Issues
All issues should be created using the [new issue form](https://github.com/glennjones/hapi-swagger/issues/new).

* Please check the "[Features from HAPI that cannot be ported to Swagger](https://github.com/glennjones/hapi-swagger/blob/master/usageguide.md#features-from-hapi-that-cannot-be-ported-to-swagger])" section of the usage guide.
* Try the plugin option `debug = true` to see if any errors or warning are logged. see [Debugging](https://github.com/glennjones/hapi-swagger/blob/master/usageguide.md#debugging)
* Clearly describe the issue including steps to reproduce it. Also include example code of any `routes` that cause an issue.



# Fixes and patches

Code changes are welcome and should follow the guidelines below. If you wish to add a new feature or make a major change it is worth raising an issue first.

* Fork the repository on GitHub.
* Fix the issue ensuring that your code follows the [style guide](https://github.com/hapijs/contrib/blob/master/Style.md).
* Add tests for your new code ensuring that you have 100% code coverage (we can help you reach 100% but will not merge without it).
    * Run `npm test` to generate a report of test coverage
* [Pull requests](https://help.github.com/articles/creating-a-pull-request/) should be made to the [master branch](https://github.com/glennjones/hapi-swagger/tree/master).



# Testing
The project has integration and unit tests. To run the test within the project type one of the following commands.
or
```bash
$ npm test
```
or
```bash
$ lab
$ lab -r html -o coverage.html
$ lab -r html -o coverage.html --lint
$ lab -r console -o stdout -r html -o coverage.html --lint


