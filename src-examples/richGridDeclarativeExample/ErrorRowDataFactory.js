const QABErrors = require("./QABErrors.json");

export default class ErrorRowDataFactory {

    createRowData() {
        let raw = QABErrors["LIBCHECKER"];
        let rowData =[];
        raw.forEach(rowD => {
            if(rowD.fail_drives === "") {
                rowData.push({...rowD, ...{"status": "PASS"}});
            } else {
                rowData.push({...rowD, ...{"status": "FAIL"} });
            }
        });
        return rowData;
    }

    getWaiversRegex() {
        let waivers = QABErrors["WaiversRegex"];
        return waivers;
    }

    createRandomPhoneNumber() {
        let result = '+';
        for (let i = 0; i < 12; i++) {
            result += Math.round(Math.random() * 10);
            if (i === 2 || i === 5 || i === 8) {
                result += ' ';
            }
        }
        return result;
    }

}