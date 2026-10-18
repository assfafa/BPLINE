use std::cell::RefCell;
use i_overlay::core::fill_rule::FillRule;
use i_overlay::core::overlay_rule::OverlayRule;
use i_overlay::float::overlay::FloatOverlay;
use i_overlay::float::relate::FloatPredicateOverlay;
use i_triangle::float::triangulatable::Triangulatable;

type Paths = Vec<Vec<[f64; 2]>>;

#[derive(Default)]
struct Runtime {
    input: Vec<f64>,
    output: Vec<f64>,
    error: String,
}

thread_local! {
    static STATE: RefCell<Runtime> = RefCell::new(Runtime::default());
}

// The JS bridge copies input after allocation and copies output before another call.
#[unsafe(no_mangle)]
pub extern "C" fn bool_input(length: usize) -> *mut f64 {
    STATE.with(|state| {
        let mut runtime = state.borrow_mut();
        if length <= 8_000_000 {
            runtime.input.resize(length, 0.0);
            runtime.input.as_mut_ptr()
        } else {
            std::ptr::null_mut()
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn bool_run(operation: u32, fill: u32) -> u32 {
    STATE.with(|state| {
        let mut runtime = state.borrow_mut();
        match execute(operation, fill, &runtime.input) {
            Ok(output) => {
                runtime.output = output;
                runtime.error.clear();
                1
            }
            Err(message) => {
                runtime.output.clear();
                runtime.error = message;
                0
            }
        }
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn bool_output() -> *const f64 {
    STATE.with(|state| state.borrow().output.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn bool_output_len() -> usize {
    STATE.with(|state| state.borrow().output.len())
}

#[unsafe(no_mangle)]
pub extern "C" fn bool_error() -> *const u8 {
    STATE.with(|state| state.borrow().error.as_ptr())
}

#[unsafe(no_mangle)]
pub extern "C" fn bool_error_len() -> usize {
    STATE.with(|state| state.borrow().error.len())
}

fn read_count(values: &[f64], cursor: &mut usize) -> Result<usize, String> {
    if let Some(value) = values.get(*cursor) {
        if value.is_finite() && *value >= 0.0 && *value <= 1_000_000.0 && value.fract() == 0.0 {
            *cursor += 1;
            Ok(*value as usize)
        } else {
            Err("Invalid Boolean input count".into())
        }
    } else {
        Err("Truncated Boolean input".into())
    }
}

fn read_paths(values: &[f64], cursor: &mut usize) -> Result<Paths, String> {
    let count = read_count(values, cursor)?;
    let mut paths = Vec::with_capacity(count.min(4096));
    for _ in 0..count {
        let length = read_count(values, cursor)?;
        let end = *cursor + length * 2;
        if end <= values.len() {
            let mut path = Vec::with_capacity(length);
            for point in values[*cursor..end].chunks_exact(2) {
                if point[0].is_finite() && point[1].is_finite() {
                    path.push([point[0], point[1]]);
                } else {
                    return Err("Non-finite Boolean coordinate".into());
                }
            }
            *cursor = end;
            if path.len() >= 3 {
                paths.push(path);
            }
        } else {
            return Err("Truncated Boolean contour".into());
        }
    }
    Ok(paths)
}

fn execute(operation: u32, fill: u32, values: &[f64]) -> Result<Vec<f64>, String> {
    let mut cursor = 0;
    let subject = read_paths(values, &mut cursor)?;
    let clip = read_paths(values, &mut cursor)?;
    if cursor != values.len() {
        return Err("Trailing Boolean input".into());
    }
    let fill_rule = match fill {
        0 => FillRule::NonZero,
        1 => FillRule::EvenOdd,
        _ => return Err("Unsupported Boolean fill rule".into()),
    };
    // Output triangulation is requested only after clipping, never for contour inputs.
    if operation == 8 {
        if subject.is_empty() {
            return Ok(vec![0.0, 0.0]);
        }
        let triangles = subject.triangulate_as::<i64>().to_triangulation::<u32>();
        let mut output = vec![triangles.points.len() as f64];
        for point in triangles.points {
            output.extend_from_slice(&point);
        }
        output.push(triangles.indices.len() as f64);
        // Rendering uses clockwise triangles; iTriangle produces counterclockwise triangles.
        for triangle in triangles.indices.chunks_exact(3) {
            output.extend([triangle[0] as f64, triangle[2] as f64, triangle[1] as f64]);
        }
        return Ok(output);
    }
    if operation == 5 || operation == 7 {
        if subject.is_empty() || clip.is_empty() {
            return Ok(vec![0.0]);
        }
        let mut predicate = FloatPredicateOverlay::<[f64; 2], i64>::from_subj_and_clip_custom(
            &subject, &clip, fill_rule, Default::default());
        let found = if operation == 5 { predicate.intersects() } else { predicate.interiors_intersect() };
        return Ok(vec![if found { 1.0 } else { 0.0 }]);
    }
    let rule = match operation {
        0 => OverlayRule::Union,
        1 => OverlayRule::Difference,
        2 => OverlayRule::Intersect,
        3 => OverlayRule::Xor,
        4 => OverlayRule::Subject,
        6 => OverlayRule::InverseDifference,
        _ => return Err("Unsupported Boolean operation".into()),
    };
    let mut overlay = FloatOverlay::<[f64; 2], i64>::from_subj_and_clip(&subject, &clip);
    let shapes = overlay.overlay(rule, fill_rule);
    if operation == 6 {
        return Ok(vec![if shapes.is_empty() { 1.0 } else { 0.0 }]);
    }
    let mut output = vec![shapes.len() as f64];
    for shape in shapes {
        output.push(shape.len() as f64);
        for contour in shape {
            output.push(contour.len() as f64);
            for point in contour {
                output.extend_from_slice(&point);
            }
        }
    }
    Ok(output)
}
