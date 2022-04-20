const attributes = [
  "id",
  "isPassword",
  "name",
  "page",
  "htmlText",
  "title",
  "text",
  "count",
  "currentDuration",
  "totalDuration",
  "hint",
  "compassEnabled",
  "toggle",
  "rotateEnabled",
  "zoomEnabled",
  "scrollEnabled",
  "subtitle",
  "keyboardAppearance",
  "children",
  "parent",
  "align",
  "orientation",
  "itemCount",
  "rowHeight",
  "safeAreaEnabled",
  "autoWidth",
  "autoHeight",
  "letterSpacing",
  "autoSizeEnabled",
  "borderVisibility",
  "backgroundModeEnabled"
];

var undefinedObject = {};
attributes.forEach(attr => undefinedObject[attr] = undefined);

module.exports = attributes;
module.exports.undefinedObject = undefinedObject;
