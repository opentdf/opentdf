const validateJsonStr = (jsonString) => {
    try {
      var o = JSON.parse(jsonString);
      // Handle non-exception-throwing cases:
      // Neither JSON.parse(false), JSON.parse(1234), or JSON.parse({}) throw errors, hence the type-checking,
      // but... JSON.parse(null) returns null, and typeof null === "object",
      // so we must check for that, too. Thankfully, null is falsey, so this suffices:
      if (o && typeof o === "object" && Object.keys(o).length) {
          return o;
      }
    }
    catch (e) {
      console.error(e);
    }
  
    return false;
  };

  export {validateJsonStr};