interface Manifest {
    events: { [key: string]: Array<string> };
    functions: {
        [key: string]: FunctionDef;
    };
}

interface FunctionDef {
    path: string;
    code?: string;
    sourceMap?: string;
}
