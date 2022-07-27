export function toggleByAttribute(attribute: string, attributeList: string[], setDataAttributes: (item: string[] | Function) => void) {
    // const premium = "https://example.com/attr/ContentExclusivity/value/Premium";
    // const restricted = "https://example.com/attr/AudienceGuidance/value/Restricted";

    if (attributeList.includes(attribute)) {
        setDataAttributes(attributeList.filter(e => { return e !== attribute }));
        console.log("attr filtered");
    } else {
        setDataAttributes((attrList: string[]) => [...attrList, attribute]);
        console.log("add attribute");
    }
}
