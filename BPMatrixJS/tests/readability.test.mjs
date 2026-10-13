import assert from "node:assert/strict";
import { test } from "node:test";
import { Linter } from "eslint";
import { parser } from "typescript-eslint";
import readability from "../../eslint/readability.mjs";

/** @param source 候选类源码 @param rules 本次启用的规范 @example Verify("class A {}", { "class-layout": "error" }); @returns 诊断列表，仅测试本仓库的可读性规则。 */
const Verify = (source, rules) => {
    const enabled = {};
    // 将简短测试名称映射为真实规则命名空间。
    for (const [name, severity] of Object.entries(rules)) {
        enabled["readability/" + name] = severity;
    }
    return new Linter().verify(source, [{ languageOptions: { parser }, plugins: { readability }, rules: enabled }]);
};

/** @example CheckAbstractFields(); @returns 无返回值，抽象属性和箭头字段都应位于字段区。 */
const CheckAbstractFields = () => {
    const source = "abstract class A { abstract readonly type:string; value=1; callback=()=>{}; constructor(input:number){this.value=input;} }";
    assert.deepEqual(Verify(source, { "class-layout": "error", "field-defaults": "error" }), []);
};

/** @example CheckMisplacedFields(); @returns 无返回值，后置字段和后置主类分别报告。 */
const CheckMisplacedFields = () => {
    const afterMethod = Verify("class A { get value(){return 1;} flag=false; }", { "class-layout": "error" });
    const afterType = Verify("type Value=number; class A { value=1; }", { "class-layout": "error" });
    assert.equal(afterMethod[0].messageId, "fields");
    assert.equal(afterType[0].messageId, "before");
};

/** @example CheckConstructorDefaults(); @returns 无返回值，直接常量需要迁到字段，参数赋值和绑定操作保留。 */
const CheckConstructorDefaults = () => {
    const invalid = Verify("class A { flag:boolean; constructor(){this.flag=false;} }", { "field-defaults": "error" });
    const valid = Verify("class A { flag=false; constructor(flag:boolean){this.flag=flag; this.setup();} setup(){} }", { "field-defaults": "error" });
    assert.equal(invalid[0].messageId, "declaration");
    assert.deepEqual(valid, []);
};

/** @example CheckHookDocumentation(); @returns 无返回值，hooks 的 getter 注释应附着到对象成员而非函数内部。 */
const CheckHookDocumentation = () => {
    const source = "const hook={ /** @example hook.value; @returns 当前值。 */ get value(){return 1;} };";
    assert.deepEqual(Verify(source, { "function-documentation": "error" }), []);
};

test("class layout recognizes abstract and arrow fields", CheckAbstractFields);
test("class layout catches fields and types hiding the primary API", CheckMisplacedFields);
test("field defaults preserve constructor inputs and setup", CheckConstructorDefaults);
test("object getter JSDoc belongs to the hook property", CheckHookDocumentation);
