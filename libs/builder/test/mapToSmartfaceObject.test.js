const assert = require("chai").assert;
const purgeCache = require("./util").purgeCache;


describe('mapToSmartfaceObject', () =>  {
  var mapper;
  
    beforeEach(()=> {
      purgeCache("../src/smfObject/mapToSmartfaceObject");
      var  Mapper = require("../src/smfObject/mapToSmartfaceObject");
      mapper = new Mapper();
    });
    
    it('should return mapped prop name', function() {
      assert.equal(mapper.get("userProps.height"), "height");
      assert.equal(mapper.get("userProps.flexProps.alignSelf"), "alignSelf");
      assert.isUndefined(mapper.get("props.flexProps.alignSelf"));
    });
    
});