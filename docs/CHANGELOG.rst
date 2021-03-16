##########
Change Log
##########

All notable changes to this project are documented in this file.
This project adheres to `Semantic Versioning <http://semver.org/>`_.

==========
Unreleased
==========

===================
15.1.0 - 2021-03-16
===================

- Compute chunk size based on upload file size and maximum chunks

===================
15.0.0 - 2020-09-14
===================

- Update FeaturesQuery feature_id type to string (not array anymore)

===================
14.3.2 - 2020-08-31
===================

- Update FeatureSearchQuery query type to string (not array anymore)
- Update Relation type property -> collection from number to Collection

===================
14.2.0 - 2020-07-22
===================

- Add optional ``relation`` parameter to FieldSchema

===================
14.1.0 - 2020-05-14
===================

- Add ``moveToCollection`` method to ``Data`` resource
- Add options parameter to duplicate method of the Data resource

===================
14.0.0 - 2020-05-06
===================

- Add ``withCredentials`` flag to connection
- Add ``createConnection`` helper function to instantiate connection

===================
13.2.0 - 2020-05-05
===================

- Download compressed files and Use pako to decompress them on the client side

===================
13.1.4 - 2020-04-23
===================

- Updated process type

===================
13.1.3 - 2020-04-17
===================

- Added "preparing" data status type

===================
13.1.2 - 2020-04-15
===================

- Updated collection type

===================
13.1.1 - 2020-04-03
===================

- Updated collection type

===================
13.1.0 - 2020-02-21
===================

- Added order by relevance constant on Data resource

===================
13.0.2 - 2020-02-03
===================

- Fixed ``addToSample`` function on the Data resource

===================
13.0.1 - 2020-01-24
===================

Changed
-------
- Upgrade TypeScript to 3.7.5

===================
13.0.0 - 2019-11-07
===================

- **BACKWARD INCOMPATIBLE:** Remove ``download`` and ``add`` permissions
- Upgraded to gulp4

===================
12.0.0 - 2019-10-10
===================

- **BACKWARD INCOMPATIBLE:** Removed ``descriptor_completed`` from samples
- Updated Query type

===================
11.1.0 - 2019-09-20
===================

- Added ``validate_password`` endpoint

===================
11.0.0 - 2019-08-09
===================

- **BACKWARD INCOMPATIBLE:** Migrate to new API

====================
10.0.12 - 2019-08-02
====================

- Fixed duplicate method on sample resource

====================
10.0.11 - 2019-07-02
====================

- Added getParents and getChildren to Data api

====================
10.0.10 - 2019-05-14
====================

Added
-------
- Added ``collection_names`` field to Data type

===================
10.0.9 - 2019-04-19
===================

Changed
-------
- Catch ``413`` Request Entity Too Large request errors
- Warn about ``*__in=empty`` query parameters

===================
10.0.8 - 2019-04-12
===================

Changed
-------
- Updated api.User.profile type

===================
10.0.7 - 2019-03-22
===================

Changed
-------
- Updated Process requirements' relations type

===================
10.0.6 - 2019-03-19
===================

Fixed
-----
- Changed requests from ``/api/data?entity__in=2726&collection=246&tags=community%3Aexpressions`` (that
  returned no results), to ``/api/data?collection=246&tags=community%3Aexpressions&entity__in=2726``

===================
10.0.5 - 2019-03-14
===================

Added
-------
- Added ``requirements`` field to Process type

===================
10.0.4 - 2019-03-11
===================

Added
-----
- Data, sample and collection duplication endpoints
- Move samples between collections endpoint

===================
10.0.3 - 2019-03-07
===================

Added
-------
- Added ``entity_names`` field to Data type

===================
10.0.2 - 2019-03-04
===================

Changed
-------
- Upgrade TypeScript to 3.3.3333

===================
10.0.1 - 2019-02-28
===================

Changed
-------
- Improved logging

===================
10.0.0 - 2019-02-06
===================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Removed settings field type from Collection

==================
9.3.1 - 2019-01-24
==================

Changed
-------
- Updated Query type

==================
9.3.0 - 2019-01-16
==================

Changed
-------
- Simplify limiting queries

==================
9.2.0 - 2019-01-14
==================

Changed
-------
- Updated Query type

==================
9.1.0 - 2019-01-07
==================

Changed
-------
- Upgrade TypeScript to 3.2
- Support typesafe shared store actions

==================
9.0.0 - 2018-11-30
==================

Changed
-------
- Made api extendable with additional injections

==================
8.1.4 - 2018-11-19
==================

Fixed
-----
- Updated Data type

==================
8.1.3 - 2018-11-14
==================

Fixed
-----
- Re-build code. Something failed when building 8.1.2

==================
8.1.2 - 2018-11-14
==================

Changed
-------
- Expand deepPickType to four levels deep

==================
8.1.1 - 2018-11-13
==================

Fixed
-----
- Updated Sample type

==================
8.1.0 - 2018-11-12
==================

Added
-----
- Add helper function shallowPickType for getting a type with limited fields
- Add helper function deepPickType for getting a type with limited fields

==================
8.0.1 - 2018-11-05
==================

Changed
-------
- Updated FieldSchema type

==================
8.0.0 - 2018-10-18
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Sample resource refactored
  ``queryAnnotated`` and ``queryUnannotated`` methods removed
  in favor of using ``query`` method directly

==================
7.1.3 - 2018-10-09
==================

Added
-----
- Order by relevance constant on Sample and Collection resource

==================
7.1.2 - 2018-09-26
==================

Fixed
-----
- Fixed types

==================
7.1.1 - 2018-09-25
==================

Added
-----
- Support transclusion in @component decorator

==================
7.1.0 - 2018-09-24
==================

Changed
-------
- Updated createUriFromPath function to add query parameters to uri

==================
7.0.1 - 2018-09-13
==================

Fixed
-----
- Fixes types

==================
7.0.0 - 2018-09-03
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Updated relations type

==================
6.0.0 - 2018-08-30
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Disallowed using deprecated ``api.Sample.queryOne({ data: data.id })``.
  Use ``api.Data.getSampleFromDataId(data.id)`` instead.
- Upgrade TypeScript to 3.0

==================
5.0.1 - 2018-08-14
==================

Fixed
-----
- Fixed disposing subscriptions to a reactive query after another subscription disposes
  before QueryObserver is initialized

==================
5.0.0 - 2018-08-03
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Changed types of sample and gene clustering
  storage objects

==================
4.0.4 - 2018-07-25
==================

Fixed
-----
- Fixed loading from state with missing fields. Loading state after introducing new
  stateful components should no longer throw an error.

==================
4.0.3 - 2018-06-07
==================

Added
-----
- Added custom partial serialization of ``undefined``, ``Infinity``, and ``NaN`` values
  that are otherwise unsupported by JSON.stringify

Changed
-------
- **BACKWARD INCOMPATIBLE:** Replaced $apply in component.subscribe with $evalAsync. This
  improves performance, but doesn't guarantee an immediate digest cycle.
- An error is thrown if state is not serializable when stateful component is saving state

==================
4.0.2 - 2018-07-13
==================

Fixed
-----
- Stopped using /datagzip for uncompressed files

==================
4.0.1 - 2018-05-23
==================

Fixed
-----
- Added input types to DataVariantTable

==================
4.0.0 - 2018-04-11
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Rename ``sample`` query field to ``entity`` in api.Data

==================
3.1.3 - 2018-04-03
==================

Changed
-------
- Updated endpoint for ungzipped url

==================
3.1.2 - 2018-03-22
==================

Added
-----
- Added ``process_slug`` to Data type

==================
3.1.1 - 2018-03-07
==================

Fixed
-----
- Added last_login and date_joined properties to User type

==================
3.1.0 - 2018-02-26
==================

Changed
-------
- Support paginated Feature.autocomplete in knowledge base module

Fixed
-----
- Fixed missing Rx import in mocked upload

==================
3.0.0 - 2018-01-24
==================

Added
-----
- Support auto-resuming api.upload after computer standby/sleep

Changed
-------
- **BACKWARD INCOMPATIBLE:** Refactored api.upload into an observable (cancelable by disposing it) with auto-retry on error
- **BACKWARD INCOMPATIBLE:** Removed utils/lang/isPromise and added utils/lang/isPromiseLike

==================
2.0.5 - 2017-11-08
==================

Fixed
-----
- Made component loading spinner consistent across angular-material versions

==================
2.0.4 - 2017-11-06
==================

Added
-----
- Add getSpeciesFromFeatures utility function

==================
2.0.2 - 2017-11-03
==================

Fixed
-----
- Add missing ``species`` fields in API types

==================
2.0.0 - 2017-11-03
==================

Changed
-------
- **BACKWARD INCOMPATIBLE:** Make species part of the feature primary key

==================
1.0.0 - 2017-10-24
==================

Added
-----
- License file

Changed
-------
- **BACKWARD INCOMPATIBLE:** Removed bundled ``dist/`` directory

==================
0.2.3 - 2017-10-23
==================

Added
-----
- Methods to sample and collection resources

==================
0.2.2 - 2017-10-16
==================

Fixed
-----
- Fix RelationEntity positon type (number -> string)

==================
0.2.1 - 2017-10-06
==================

Added
-----
- Allow override of what shared store value is saved

==================
0.2.0 - 2017-10-04
==================

Added
-----
- Added relation resource
- Add slug exits method to data resource
- Add DataVariantTable type
- Add QC storage type
- Add content parameters to set permissions request
- Add delete content parameter to sample and collection delete method
- Add helper function for getting source from features
- Add get feature method
- Add missing compiled error.js
- Add getFeatures method to knowledge base module

Changed
-------
- Make queries non-reactive by default
- Improve watch API
- Explicitly set root element before each test
- Allow CollectionHydrateData into isData, isCollection, and isSampleBase
- Remove errorLog and warn about unhandled errors on production too
- Rename permissions attribute to current_user_permissions
- Update npm-shrinkwrap
- Expose shared store manager on StatefulComponentBase as protected member
- Revert setting prototype on GenError
- Update clustering type
- Upgrade typescript to 2.5.2 and support running tests on node 8
- Upgrade angular to 1.6.6

Fixed
-----
- Fix ComponentBase and Computation documentation
- Fix collection, sample and data type guards
- Fix rx typings
- Fix extending GenError
