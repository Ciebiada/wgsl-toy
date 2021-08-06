import mainShader from 'bundle-text:./shaders/main.wgsl'
import quadShader from 'bundle-text:./shaders/quad.wgsl'

const setUpContext = (width, height, adapter, device) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  document.body.appendChild(canvas)

  const context = canvas.getContext('webgpu')

  const devicePixelRatio = window.devicePixelRatio || 1

  const presentationSize = [
    canvas.clientWidth * devicePixelRatio,
    canvas.clientHeight * devicePixelRatio
  ]

  context.configure({
    device,
    format: context.getPreferredFormat(adapter),
    size: presentationSize,
  })

  return context
}

(async () => {
  if (!navigator.gpu) {
    console.log("WebGPU is not supported. Enable chrome://flags/#enable-unsafe-webgpu flag.")
    return
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.log("Failed to get GPU adapter.")
    return
  }

  const device = await adapter.requestDevice()

  const workGroupSize = 8
  // const width = workGroupSize * 135 // 1080
  const width = workGroupSize * 90 // 720
  const height = width
  const dispatchGroups = width / workGroupSize

  const context = setUpContext(width, height, adapter, device)

  const paramsBufferSize = 3 * Uint32Array.BYTES_PER_ELEMENT
  const paramsBuffer = device.createBuffer({
    size: paramsBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  const computePipeline = device.createComputePipeline({
    compute: {
      module: device.createShaderModule({
        code: mainShader
      }),
      entryPoint: "main"
    }
  })

  const quadPipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: quadShader,
      }),
      entryPoint: 'vert_main',
    },
    fragment: {
      module: device.createShaderModule({
        code: quadShader,
      }),
      entryPoint: 'frag_main',
      targets: [
        {
          format: context.getPreferredFormat(adapter),
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
  })

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  })

  // textures
  const textures = [0, 1].map(() => device.createTexture({
    size: {
      width,
      height,
    },
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.STORAGE |
      GPUTextureUsage.SAMPLED,
  }))

  // bind groups
  const computeBindGroup0 = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: paramsBuffer
        }
      },
      {
        binding: 1,
        resource: sampler
      },
    ]
  })

  const computeBindGroups = [0, 1].map(i =>
    device.createBindGroup({
      layout: computePipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: textures[(i + 1) % 2].createView()
        },
        {
          binding: 1,
          resource: textures[i].createView()
        },
      ]
    })
  )

  const quadBindGroup0 = device.createBindGroup({
    layout: quadPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: sampler,
      }
    ],
  })

  const quadBindGroups = [0, 1].map(i =>
    device.createBindGroup({
      layout: quadPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: textures[i].createView(),
        }
      ],
    }),
  )

  const renderFrame = (frame) => () => {
    device.queue.writeBuffer(
      paramsBuffer,
      0,
      new Uint32Array([width, height, frame])
    )

    const commandEncoder = device.createCommandEncoder()

    const computePass = commandEncoder.beginComputePass()
    computePass.setPipeline(computePipeline)
    computePass.setBindGroup(0, computeBindGroup0)
    computePass.setBindGroup(1, computeBindGroups[frame % 2])
    computePass.dispatch(dispatchGroups, dispatchGroups)
    computePass.endPass()

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: 'store',
        },
      ],
    })

    passEncoder.setPipeline(quadPipeline)
    passEncoder.setBindGroup(0, quadBindGroup0)
    passEncoder.setBindGroup(1, quadBindGroups[frame % 2])
    passEncoder.draw(6, 1, 0, 0)
    passEncoder.endPass()
    device.queue.submit([commandEncoder.finish()])

    requestAnimationFrame(renderFrame(frame + 1))
  }

  requestAnimationFrame(renderFrame(0))
})()
