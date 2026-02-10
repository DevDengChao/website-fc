let subject = require("../src/index");
let fs = require("fs");
const path = require("path");

let exampleDist = path.join(__dirname, "../example/dist");
let exampleTmpl = path.join(__dirname, "../example/s.yaml");
let outputDir = path.join(__dirname, "../src/code/public");

test('props.function.codeUri not present', async function () {
    let result = await subject({}, {});
    expect(result).toBeUndefined();
});

test('path.configPath not present', async function () {
    let catchTriggered = false;
    try {
        await subject({
            props: {
                function: {
                    codeUri: exampleDist
                }
            }
        }, {});
    } catch (e) {
        expect(e.code).toBe("ERR_INVALID_ARG_TYPE");
        expect(e.message.toString().includes("The \"path\" argument must be of type string.")).toBeTruthy();
        catchTriggered = true;
    }
    expect(catchTriggered).toBeTruthy();
});

test('default index.html', async function () {
    let result = await subject({
        path: {
            configPath: exampleTmpl
        },
        props: {
            function: {
                codeUri: exampleDist
            }
        }
    }, {});

    // content are copied from exampleDist to outputDir
    expect(fs.readdirSync(outputDir)).toStrictEqual(fs.readdirSync(exampleDist));

    expect(result.props.function.runtime).toBe("custom");
    expect(result.props.function.codeUri).toBe(path.join(__dirname, "../src/code"));
    expect(result.props.function.caPort).toBe(9000);
    expect(result.props.function.customRuntimeConfig.command).toStrictEqual(["node"]);
    expect(result.props.function.customRuntimeConfig.args).toStrictEqual(["/code/index.js"]);

    let generatedIndexContent = fs.readFileSync(path.join(__dirname, "../src/code/index.js")).toString();
    expect(generatedIndexContent.includes("index.html")).toBeTruthy();
});

test('relative codeUri', async function () {
    let originCodeUri = "./dist";
    let inputs = {
        path: {
            configPath: exampleTmpl
        },
        props: {
            function: {
                codeUri: originCodeUri
            }
        }
    };
    await subject(inputs, {});

    let joinedPath = path.join(path.dirname(inputs.path.configPath), originCodeUri);
    expect(fs.readdirSync(outputDir)).toStrictEqual(fs.readdirSync(joinedPath));
});

test('custom index.htm', async function () {
    await subject({
        path: {
            configPath: exampleTmpl
        },
        props: {
            function: {
                codeUri: exampleDist
            }
        }
    }, {
        index: "index.htm"
    });

    let generatedIndexContent = fs.readFileSync(path.join(__dirname, "../src/code/index.js")).toString();
    expect(generatedIndexContent.includes("index.htm")).toBeTruthy();
});

test('codeUri as symbolic link', async function () {
    // Create a temporary directory with content
    const tempDir = path.join(__dirname, "../test-temp-dir");
    const symlinkPath = path.join(__dirname, "../test-symlink");
    
    // Clean up any existing test directories
    if (fs.existsSync(symlinkPath)) {
        fs.unlinkSync(symlinkPath);
    }
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
    
    // Create temporary directory with index.html
    fs.mkdirSync(tempDir);
    fs.writeFileSync(path.join(tempDir, "index.html"), "<html><body>Test</body></html>");
    
    // Create symbolic link pointing to the temporary directory
    fs.symlinkSync(tempDir, symlinkPath, 'dir');
    
    try {
        // Test with the symbolic link as codeUri
        let result = await subject({
            path: {
                configPath: exampleTmpl
            },
            props: {
                function: {
                    codeUri: symlinkPath
                }
            }
        }, {});
        
        // Verify that the content was copied correctly
        expect(fs.existsSync(path.join(outputDir, "index.html"))).toBeTruthy();
        expect(result.props.function.runtime).toBe("custom");
    } finally {
        // Clean up
        if (fs.existsSync(symlinkPath)) {
            fs.unlinkSync(symlinkPath);
        }
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    }
});


