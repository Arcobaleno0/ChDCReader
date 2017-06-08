"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

define(["jquery", "main", "Page", "utils", "uiutils", 'mylib/infinitelist', "ReadingRecord", "uifactory"], function ($, app, Page, utils, uiutils, Infinitelist, ReadingRecord, uifactory) {
  var MyPage = function (_Page) {
    _inherits(MyPage, _Page);

    function MyPage() {
      _classCallCheck(this, MyPage);

      var _this = _possibleConstructorReturn(this, (MyPage.__proto__ || Object.getPrototypeOf(MyPage)).call(this));

      _this.book = null;
      _this.readingRecord = null;
      _this.chapterList = null;
      _this.isNewBook = true;
      _this.buildCatalogView = uifactory.buildCatalogView.bind(_this);
      _this.lastReadingScrollTop = 0;
      _this.chapterContainer;
      _this.isFullScreen = false;
      return _this;
    }

    _createClass(MyPage, [{
      key: "onClose",
      value: function onClose() {
        var _this2 = this;

        this.chapterList.close();

        if (this.isNewBook) {
          if (!app.bookShelf.hasBook(this.book)) {
            uiutils.showMessageDialog("加入书架", "\u662F\u5426\u5C06 " + this.book.name + " \u52A0\u5165\u4E66\u67B6\uFF1F", function () {
              app.bookShelf.addBook(_this2.book, _this2.readingRecord);
              app.bookShelf.save().then(function () {
                uiutils.showMessage("添加成功！");
                _this2.fireEvent("myclose");
              });
            }, function () {
              _this2.book.clearCacheChapters();
              _this2.fireEvent("myclose");
            });
          } else {
            this.fireEvent("myclose");
          }
        }
      }
    }, {
      key: "onLoad",
      value: function onLoad(_ref) {
        var _this3 = this;

        var params = _ref.params;

        this.chapterContainer = $("#chapterContainer");
        var bookAndReadRecordInBookShelf = app.bookShelf.hasBook(params.book);
        if (bookAndReadRecordInBookShelf) {
          this.book = bookAndReadRecordInBookShelf.book;
          this.readingRecord = bookAndReadRecordInBookShelf.readingRecord;
          this.isNewBook = false;
        } else {
          this.book = params.book;
          this.readingRecord = params.readingRecord || new ReadingRecord();
        }
        this.lastReadingScrollTop = this.readingRecord.getPageScrollTop();
        this.book.checkBookSources();
        this.loadView();

        this.book.getChapterIndex(this.readingRecord.chapterTitle, this.readingRecord.chapterIndex).then(function (index) {
          if (index >= 0) _this3.readingRecord.chapterIndex = index;
          _this3.refreshChapterList();
        });
      }
    }, {
      key: "onPause",
      value: function onPause() {
        if (typeof StatusBar != "undefined") StatusBar.show();
        this.readingRecord.pageScrollTop = this.chapterList.getPageScorllTop();
        app.bookShelf.save();
      }
    }, {
      key: "loadView",
      value: function loadView() {
        var _this4 = this;

        $("#chapterContainer").on("click", function (event) {
          $('.toolbar').toggle();
          var excludes = ["btnNext", "btnLast"];
          var x = event.clientX,
              y = event.clientY;

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = excludes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var e = _step.value;

              var rect = document.getElementById(e).getBoundingClientRect();
              if (utils.isPointInRect(rect, { x: x, y: y })) return $('.toolbar').toggle();
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        });
        $(".toolbar").blur(function (e) {
          return $('.toolbar').hide();
        });
        $(".toolbar").click(function (e) {
          return $('.toolbar').hide();
        });

        $("#btnNext").click(this.nextChapter.bind(this));
        $("#btnLast").click(this.previousChapter.bind(this));

        $("#btnClose").click(function (e) {
          return app.page.closePage();
        });

        $("#btnCatalog").click(function (e) {
          return _this4.loadCatalog();
        });
        $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");

        $("#btnToggleNight").click(function (e) {

          app.theme.toggleNight();
          $("#labelNight").text(app.theme.isNight() ? "白天" : "夜间");
        });
        $("#btnBadChapter").click(function (e) {
          _this4.refreshChapterList({
            excludes: [_this4.readingRecord.options.contentSourceId]
          });
        });
        $("#btnRefresh").click(function (e) {
          _this4.refreshChapterList();
        });
        $("#btnSortReversed").click(function (e) {
          var list = $('#listCatalog');
          list.append(list.children().toArray().reverse());
        });

        $("#btnChangeMainSource").click(function () {
          $("#modalBookSource").modal('show');
          _this4.loadBookSource();
        });
        $("#btnChangeContentSource").click(function () {
          $("#modalBookSource").modal('show');
          _this4.loadBookSource(true);
        });
        $('#modalCatalog').on('shown.bs.modal', function (e) {
          var targetChapter = $('#current-catalog-chapter');
          if (targetChapter && targetChapter.length > 0) {
            if (targetChapter.parent().attr('id') == "listCatalog") targetChapter[0].scrollIntoView();else for (var _e = targetChapter.parent(); _e.attr('id') != "listCatalog"; _e = _e.parent()) {
              if (_e.hasClass("collapse")) _e.collapse('show').on("shown.bs.collapse", function (e) {
                targetChapter[0].scrollIntoView();
              });
            }
          }
        });
        $('#btnBookDetail').click(function (e) {
          return app.page.showPage("bookdetail", { book: _this4.book });
        });
        $(".labelMainSource").text(app.bookSourceManager.getBookSource(this.book.mainSourceId).name).click(function (e) {
          return window.open(_this4.book.getOfficialDetailLink(), '_system');
        });
        $("#btnRefreshCatalog").click(function () {
          return _this4.loadCatalog(true);
        });
        if (this.isNewBook) {
          $("#btnAddtoBookShelf").show().click(function (e) {
            app.bookShelf.addBook(_this4.book, _this4.readingRecord);
            $(event.currentTarget).css("display", "none");
            app.bookShelf.save().then(function () {
              uiutils.showMessage("添加成功！");
            }).catch(function (error) {
              $(event.currentTarget).css("display", "block");
            });
          });
        }
        $('#chapterContainer').on("scroll", function (e) {
          $(".labelChatperPercent").text(parseInt(_this4.chapterList.getScrollRate() * 100) + " %");
        });
      }
    }, {
      key: "loadBookSource",
      value: function loadBookSource() {
        var _this5 = this;

        var changeContentSource = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


        var sources = !changeContentSource ? this.book.getSourcesKeysByMainSourceWeight() : this.book.getSourcesKeysSortedByWeight();
        var currentSourceId = changeContentSource ? this.readingRecord.options.contentSourceId : this.book.mainSourceId;
        $('#modalBookSourceLabel').text(changeContentSource ? "更换内容源" : "更换目录源");
        var changeContentSourceClickEvent = function changeContentSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');

          _this5.readingRecord.options.contentSourceId = bid;
          _this5.readingRecord.options.contentSourceChapterIndex = null;

          _this5.refreshChapterList();
        };

        var changeCatalogSourceClickEvent = function changeCatalogSourceClickEvent(event) {
          var target = event.currentTarget;
          if (!target) return;
          var bid = $(target).data('bsid');
          var oldMainSource = currentSourceId;

          _this5.book.setMainSourceId(bid).then(function (book) {
            return app.bookShelf.save();
          }).catch(function (error) {
            return uiutils.showError(app.error.getMessage(error));
          });

          $("#modalCatalog").modal('hide');

          $(".labelMainSource").text(app.bookSourceManager.getBookSource(_this5.book.mainSourceId).name);

          if (_this5.readingRecord.chapterIndex) {
            _this5.book.fuzzySearch(_this5.book.mainSourceId, _this5.readingRecord.chapterIndex, { bookSourceId: oldMainSource }).then(function (_ref2) {
              var chapter = _ref2.chapter,
                  index = _ref2.index;

              _this5.readingRecord.setReadingRecord(chapter.title, index, {});
              _this5.refreshChapterList();
            }).catch(function (error) {
              _this5.readingRecord.reset();
              _this5.refreshChapterList();
            });
          } else {
            _this5.refreshChapterList();
          }

          _this5.book.refreshBookInfo();
        };

        var nlbseClickEvent = changeContentSource ? changeContentSourceClickEvent : changeCatalogSourceClickEvent;

        var listBookSource = $("#listBookSource");
        listBookSource.empty();
        var listBookSourceEntry = $(".template .listBookSourceEntry");
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = sources[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var bsk = _step2.value;

            if (bsk == currentSourceId) continue;
            var nlbse = listBookSourceEntry.clone();
            nlbse.text(app.bookSourceManager.getBookSource(bsk).name);
            nlbse.data("bsid", bsk);
            nlbse.click(nlbseClickEvent.bind(this));
            listBookSource.append(nlbse);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        ;
      }
    }, {
      key: "loadCatalog",
      value: function loadCatalog(forceRefresh) {
        var _this6 = this;

        app.showLoading();
        $('#listCatalogContainer').height($(window).height() * 0.5);

        return this.book.getCatalog({ forceRefresh: forceRefresh, groupByVolume: true }).then(function (catalog) {
          var listCatalog = $("#listCatalog");
          listCatalog.empty();
          listCatalog.append(_this6.buildCatalogView(catalog, function (e) {
            var chapter = $(e.currentTarget).data("chapter");
            _this6.readingRecord.setReadingRecord(chapter.title, chapter.index, { contentSourceId: _this6.readingRecord.options.contentSourceId });
            _this6.refreshChapterList();
          }, "#listCatalog", function (chapter, nc) {
            if (chapter.index == _this6.readingRecord.chapterIndex) nc.attr("id", "current-catalog-chapter");
            if (chapter.isVIP()) nc.addClass("vip-chapter");
          }));
          app.hideLoading();
        }).catch(function (error) {
          uiutils.showError(app.error.getMessage(error));
          app.hideLoading();
        });
      }
    }, {
      key: "refreshChapterList",
      value: function refreshChapterList(options) {
        var _this7 = this;

        app.showLoading();
        var opts = Object.assign({}, this.readingRecord.getOptions(), options);
        if (this.chapterList) this.chapterList.close();

        this.chapterList = new Infinitelist($('#chapterContainer')[0], $('#chapters')[0], this.book.buildChapterIterator(this.readingRecord.getChapterIndex(), 1, opts, this.buildChapter.bind(this)), this.book.buildChapterIterator(this.readingRecord.getChapterIndex() - 1, -1, opts, this.buildChapter.bind(this)), { disableCheckPrevious: false });
        this.chapterList.onError = function (e) {
          app.hideLoading();
          uiutils.showError(app.error.getMessage(e.error));
        };

        this.chapterList.onCurrentElementChanged = function (_ref3) {
          var newValue = _ref3.new,
              oldValue = _ref3.old;

          newValue = $(newValue);
          var readingRecord = newValue.data('readingRecord');
          if (readingRecord.chapterIndex >= 0) {
            (function () {
              var contentSourceId = readingRecord.options.contentSourceId;
              Object.assign(_this7.readingRecord, readingRecord);
              $(".labelContentSource").text(app.bookSourceManager.getBookSource(contentSourceId).name).click(function (e) {
                return window.open(_this7.book.getOfficialDetailLink(contentSourceId), '_system');
              });
            })();
          } else {
            _this7.readingRecord.setFinished(true);
          }
          $(".labelChapterTitle").text(readingRecord.chapterTitle);
          app.hideLoading();
        };
        this.chapterList.onNewElementFinished = function (_ref4) {
          var newElement = _ref4.newElement,
              direction = _ref4.direction,
              isFirstElement = _ref4.isFirstElement;

          if (!isFirstElement) return;

          app.hideLoading();
          if (_this7.lastReadingScrollTop) {
            var cs = $('#chapterContainer').scrollTop();
            $('#chapterContainer').scrollTop(cs + _this7.lastReadingScrollTop);
            _this7.lastReadingScrollTop = 0;
          }
        };

        var lastScroll = void 0;
        var threshold = 100;
        this.chapterList.onScrollDown = function (e) {
          if (lastScroll == undefined || e.scrollTop - lastScroll > threshold) {
            _this7.toggleFullScreen(true);
            lastScroll = e.scrollTop;
          }
        };

        this.chapterList.onScrollUp = function (e) {
          if (lastScroll == undefined || lastScroll - e.scrollTop > threshold) {
            _this7.toggleFullScreen(false);
            lastScroll = e.scrollTop;
          }
        };

        this.chapterList.loadList();
      }
    }, {
      key: "toggleFullScreen",
      value: function toggleFullScreen(full) {
        var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (full == undefined) full = !this.isFullScreen;

        if (full && (!this.isFullScreen || force)) {
          this.chapterContainer[0].style.top = "0";
          this.chapterContainer[0].style.bottom = "0";
          $("#mainViewHeader, #mainViewFooter").hide();
          if (typeof StatusBar != "undefined" && window.innerHeight < window.innerWidth) StatusBar.hide();
          this.isFullScreen = true;
        } else if (!full && (this.isFullScreen || force)) {
          this.chapterContainer.removeAttr("style");
          $("#mainViewHeader, #mainViewFooter").show();
          if (typeof StatusBar != "undefined") StatusBar.show();
          this.isFullScreen = false;
        }
      }
    }, {
      key: "buildLastPage",
      value: function buildLastPage() {
        var _this8 = this;

        var nc = $('.template .readFinished').clone();
        if (!nc || nc.length <= 0) return null;

        nc.height($('#chapterContainer').height());

        nc.find(".offical-site").click(function (e) {
          return window.open(_this8.book.getOfficialDetailLink(), '_system');
        });
        nc.find("img.offical-site").attr('src', "img/logo/" + this.book.mainSourceId + ".png");

        nc.data("readingRecord", new ReadingRecord({ chapterTitle: "读完啦", chapterIndex: -1 }));
        this.loadElseBooks(nc.find(".elseBooks"));
        return nc[0];
      }
    }, {
      key: "loadElseBooks",
      value: function loadElseBooks(list) {
        var _this9 = this;

        function addBook(bookshelfitem) {
          var prepend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

          var nb = $('.template .book').clone();
          if (bookshelfitem.book.cover) nb.find('.book-cover').attr('src', bookshelfitem.book.cover);
          nb.find('.book-name').text(bookshelfitem.book.name);
          nb.click(function () {
            app.page.closeCurrentPagetAndShow("readbook", { book: bookshelfitem.book, readingRecord: bookshelfitem.readingRecord });
          });
          if (prepend) list.prepend(nb);else list.append(nb);
        }

        var unFinishedBooks = app.bookShelf.books.filter(function (e) {
          return !e.readingRecord.isFinished && e.book != _this9.book;
        }).reverse();
        unFinishedBooks.forEach(addBook);

        var finishedBooks = app.bookShelf.books.filter(function (e) {
          return e.readingRecord.isFinished && e.book != _this9.book;
        });
        finishedBooks.forEach(function (e) {
          e.book.getLastestChapter().then(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 1),
                lastestChapter = _ref6[0];

            if (!e.readingRecord.equalChapterTitle(lastestChapter)) addBook(e, true);
          });
        });
      }
    }, {
      key: "buildChapter",
      value: function buildChapter() {
        var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            chapter = _ref7.chapter,
            index = _ref7.index,
            options = _ref7.options;

        var direction = arguments[1];

        if (!chapter) {
          if (direction > 0) return this.buildLastPage();else return null;
        }

        this.book.getCatalog().then(function (catalog) {
          return $(".labelBookPercent").text(parseInt(index / catalog.length * 100) + " %");
        });

        var nc = $('.template .chapter').clone();
        if (!nc || nc.length <= 0) return null;
        nc.find(".chapter-title").text(chapter.title);

        var content = $("<div>" + chapter.content + "</div>");
        content.find('p').addClass('chapter-p');

        function onload(e) {
          $(e.target).css('min-height', "").off('load', onload);
        }
        content.find('img').addClass('content-img').on('error', uiutils.imgOnErrorEvent).css('min-height', this.chapterContainer.width() * 2 + "px").on('load', onload);

        nc.find(".chapter-content").html(content);
        nc.data("readingRecord", new ReadingRecord({ chapterTitle: chapter.title, chapterIndex: index, options: options }));

        return nc[0];
      }
    }, {
      key: "nextChapter",
      value: function nextChapter() {
        app.showLoading();
        this.chapterList.nextElement(false).then(function () {
          return app.hideLoading();
        });
      }
    }, {
      key: "previousChapter",
      value: function previousChapter() {
        app.showLoading();
        this.chapterList.previousElement(true).then(function () {
          return app.hideLoading();
        });
      }
    }]);

    return MyPage;
  }(Page);

  return MyPage;
});