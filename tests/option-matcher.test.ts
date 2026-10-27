import { strict as assert } from "node:assert";
import { test } from "node:test";
import { matchSelectOption, parseBooleanValue } from "../src/content/option-matcher";

test("matchSelectOption: coincidencias exactas, insensibles a mayúsculas/minúsculas y tildes", () => {
  const options = [
    { value: "AR", text: "Argentina" },
    { value: "CL", text: "Chile" },
    { value: "MX", text: "México" },
    { value: "PE", text: "Perú" },
    { value: "remote", text: "Trabajo Remoto" },
  ];

  // Coincidencia exacta por texto y por valor
  assert.equal(matchSelectOption(options, "Argentina"), "AR");
  assert.equal(matchSelectOption(options, "AR"), "AR");
  assert.equal(matchSelectOption(options, "Chile"), "CL");
  assert.equal(matchSelectOption(options, "CL"), "CL");

  // Insensible a mayúsculas y minúsculas
  assert.equal(matchSelectOption(options, "argentina"), "AR");
  assert.equal(matchSelectOption(options, "ar"), "AR");
  assert.equal(matchSelectOption(options, "CHILE"), "CL");
  assert.equal(matchSelectOption(options, "cl"), "CL");
  assert.equal(matchSelectOption(options, "trabajo remoto"), "remote");
  assert.equal(matchSelectOption(options, "TRABAJO REMOTO"), "remote");

  // Insensible a tildes y diacríticos
  assert.equal(matchSelectOption(options, "mexico"), "MX");
  assert.equal(matchSelectOption(options, "MEXICO"), "MX");
  assert.equal(matchSelectOption(options, "México"), "MX");
  assert.equal(matchSelectOption(options, "peru"), "PE");
  assert.equal(matchSelectOption(options, "PERU"), "PE");
  assert.equal(matchSelectOption(options, "Perú"), "PE");

  // Con espacios adicionales alrededor (trim)
  assert.equal(matchSelectOption(options, "  Argentina  "), "AR");
  assert.equal(matchSelectOption(options, "  mexico  "), "MX");
});

test("matchSelectOption: valores no encontrados o ambiguos retornan null", () => {
  const options = [
    { value: "AR", text: "Argentina" },
    { value: "CL", text: "Chile" },
  ];

  // Valor no existente
  assert.equal(matchSelectOption(options, "Uruguay"), null);
  assert.equal(matchSelectOption(options, "UY"), null);
  assert.equal(matchSelectOption(options, "Brasil"), null);

  // Cadenas vacías o con solo espacios
  assert.equal(matchSelectOption(options, ""), null);
  assert.equal(matchSelectOption(options, "   "), null);

  // Lista de opciones vacía
  assert.equal(matchSelectOption([], "Argentina"), null);

  // Opciones ambiguas con valores en conflicto retornan null
  const ambiguousOptions = [
    { value: "opt1", text: "Opción Duplicada" },
    { value: "opt2", text: "Opción Duplicada" },
  ];
  assert.equal(matchSelectOption(ambiguousOptions, "Opción Duplicada"), null);
});

test("parseBooleanValue: mapeo de booleanos válidos", () => {
  // Valores que representan true
  assert.equal(parseBooleanValue("true"), true);
  assert.equal(parseBooleanValue("True"), true);
  assert.equal(parseBooleanValue("TRUE"), true);
  assert.equal(parseBooleanValue("si"), true);
  assert.equal(parseBooleanValue("sí"), true);
  assert.equal(parseBooleanValue("SÍ"), true);
  assert.equal(parseBooleanValue("Si"), true);
  assert.equal(parseBooleanValue("yes"), true);
  assert.equal(parseBooleanValue("Yes"), true);
  assert.equal(parseBooleanValue("YES"), true);
  assert.equal(parseBooleanValue("1"), true);
  assert.equal(parseBooleanValue("  1  "), true);
  assert.equal(parseBooleanValue("  sí  "), true);

  // Valores que representan false
  assert.equal(parseBooleanValue("false"), false);
  assert.equal(parseBooleanValue("False"), false);
  assert.equal(parseBooleanValue("FALSE"), false);
  assert.equal(parseBooleanValue("no"), false);
  assert.equal(parseBooleanValue("No"), false);
  assert.equal(parseBooleanValue("NO"), false);
  assert.equal(parseBooleanValue("0"), false);
  assert.equal(parseBooleanValue("  0  "), false);
  assert.equal(parseBooleanValue("  no  "), false);
});

test("parseBooleanValue: ignorado de cadenas ambiguas o inválidas retorna null", () => {
  assert.equal(parseBooleanValue(""), null);
  assert.equal(parseBooleanValue("   "), null);
  assert.equal(parseBooleanValue("maybe"), null);
  assert.equal(parseBooleanValue("tal vez"), null);
  assert.equal(parseBooleanValue("unknown"), null);
  assert.equal(parseBooleanValue("2"), null);
  assert.equal(parseBooleanValue("-1"), null);
  assert.equal(parseBooleanValue("not"), null);
  assert.equal(parseBooleanValue("agree"), null);
  assert.equal(parseBooleanValue("sí y no"), null);
});
