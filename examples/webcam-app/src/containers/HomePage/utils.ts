import { Dispatch, SetStateAction } from "react";

export function toggleByAttribute(attribute: string, attributeList: string[], setDataAttributes: Dispatch<SetStateAction<string[]>>) {
    if (attributeList.includes(attribute)) {
        setDataAttributes(attributeList.filter(e => { return e !== attribute }));
        console.log("attr filtered", attributeList, attribute);
    } else {
        setDataAttributes((attrList: string[]) => [...attrList, attribute]);
        console.log("add attribute", attributeList, attribute);
    }
}
